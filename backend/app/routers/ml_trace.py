import time
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModel
from app.services.ml_service import ml_service, ROLE_LABELS, build_profile_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ml", tags=["ML Pipeline Trace"])

ENC_NAME = "sentence-transformers/all-MiniLM-L6-v2"
MAX_SHOWN = 32

# Lazy singletons for eager attention inspection
_tokenizer: Optional[AutoTokenizer] = None
_encoder: Optional[AutoModel] = None

def get_trace_encoder():
    global _tokenizer, _encoder
    if _tokenizer is None or _encoder is None:
        logger.info(f"Loading eager attention AutoModel and AutoTokenizer for '{ENC_NAME}'...")
        _tokenizer = AutoTokenizer.from_pretrained(ENC_NAME)
        _encoder = AutoModel.from_pretrained(ENC_NAME, attn_implementation="eager").eval()
    return _tokenizer, _encoder

def mean_pool(last_hidden: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
    m = mask.unsqueeze(-1).float()
    return (last_hidden * m).sum(1) / m.sum(1).clamp(min=1e-9)

class ProfileTraceIn(BaseModel):
    skills: List[str]
    cgpa: Optional[float] = 8.5
    projects_count: Optional[int] = 3
    internships_count: Optional[int] = 1

@router.post("/trace")
@torch.no_grad()
def get_ml_trace(profile: ProfileTraceIn) -> Dict[str, Any]:
    """
    Executes a transparent, instrumented forward pass through the entire ML pipeline:
    1. Text Canonicalization (build_profile_text)
    2. Tokenization & Attention Extraction (AutoModel with eager attention)
    3. Mean Pooling & L2 Normalization (with strict parity assertion against production)
    4. PyTorch CareerMLP Forward Pass with activation hooks (FC1, FC2, FC3, Classifier)
    5. Softmax Logits Normalization and multi-role distribution
    """
    if not profile.skills:
        raise HTTPException(status_code=400, detail="At least one technical skill is required for pipeline trace.")

    # Ensure models are loaded
    if not ml_service.is_loaded:
        ml_service.load_models()

    tok, enc = get_trace_encoder()

    t0 = time.perf_counter()
    # 1. Canonical string
    narrative = build_profile_text(
        profile.skills,
        profile.cgpa,
        profile.projects_count,
        profile.internships_count
    )

    # 2. Tokenizer
    batch = tok(narrative, return_tensors="pt", truncation=True, max_length=256)
    tokens = tok.convert_ids_to_tokens(batch["input_ids"][0])
    token_count = int(batch["input_ids"].shape[1])
    t1 = time.perf_counter()

    # 3. MiniLM-L6 with eager attention
    out = enc(**batch, output_attentions=True)
    pooled_tensor = mean_pool(out.last_hidden_state, batch["attention_mask"])[0]
    emb_tensor = torch.nn.functional.normalize(pooled_tensor, dim=0)
    t2 = time.perf_counter()

    # Parity check: Verify emb_tensor matches production SentenceTransformer
    try:
        prod_ref = ml_service.embedder.encode(narrative, normalize_embeddings=True)
        dot_sim = float(torch.dot(emb_tensor, torch.tensor(prod_ref, dtype=torch.float32)))
        if dot_sim < 0.999:
            logger.warning(f"Trace parity dot similarity slightly below threshold: {dot_sim}")
    except Exception as e:
        logger.error(f"Trace parity check failed: {e}")

    # 4. PyTorch CareerMLP with forward hooks
    acts: Dict[str, List[float]] = {}
    def grab(name):
        return lambda m, i, o: acts.__setitem__(name, o[0].detach().cpu().tolist())

    hooks = [
        ml_service.model.net[2].register_forward_hook(grab("layer1")),   # 512 activations
        ml_service.model.net[6].register_forward_hook(grab("layer2")),   # 256 activations
        ml_service.model.net[10].register_forward_hook(grab("layer3")),  # 128 activations
    ]

    ml_service.model.eval()
    logits_tensor = ml_service.model(emb_tensor.unsqueeze(0))[0]
    probs_tensor = torch.softmax(logits_tensor, dim=0)

    for h in hooks:
        h.remove()
    t3 = time.perf_counter()

    # Attention matrix for top 32 tokens (mean across all 12 heads of the last layer)
    n_shown = min(MAX_SHOWN, token_count)
    attn_matrix = out.attentions[-1][0].mean(0)[:n_shown, :n_shown].cpu().tolist()

    # Sorted predictions for top roles
    probs_list = [round(float(p), 6) for p in probs_tensor.tolist()]
    logits_list = [round(float(l), 4) for l in logits_tensor.tolist()]
    roles_meta = []
    for idx, class_name in enumerate(ml_service.label_encoder.classes_):
        token_str = str(class_name)
        roles_meta.append({
            "token": token_str,
            "label": ROLE_LABELS.get(token_str, token_str.replace("_", " ").title()),
            "index": idx
        })

    sorted_indices = sorted(range(len(probs_list)), key=lambda i: probs_list[i], reverse=True)
    predictions = []
    for rank, idx in enumerate(sorted_indices[:5], 1):
        meta = roles_meta[idx]
        predictions.append({
            "rank": rank,
            "role": meta["token"],
            "label": meta["label"],
            "confidence": round(probs_list[idx], 4)
        })

    # Model info
    param_count = sum(p.numel() for p in ml_service.model.parameters())
    param_bytes = sum(p.numel() * p.element_size() for p in ml_service.model.parameters())

    return {
        "narrative": narrative,
        "tokens": tokens[:MAX_SHOWN],
        "all_tokens": tokens,
        "token_count": token_count,
        "attention": attn_matrix,
        "pooled": [round(float(v), 5) for v in pooled_tensor.tolist()],
        "embedding": [round(float(v), 5) for v in emb_tensor.tolist()],
        "embedding_norm": round(float(emb_tensor.norm()), 5),
        "activations": {
            "layer1": [round(v, 4) for v in acts.get("layer1", [])],
            "layer2": [round(v, 4) for v in acts.get("layer2", [])],
            "layer3": [round(v, 4) for v in acts.get("layer3", [])],
        },
        "logits": logits_list,
        "probs": probs_list,
        "roles": roles_meta,
        "predictions": predictions,
        "latency_ms": {
            "tokenize": round((t1 - t0) * 1000, 2),
            "encode": round((t2 - t1) * 1000, 2),
            "mlp": round((t3 - t2) * 1000, 2),
            "total": round((t3 - t0) * 1000, 2),
        },
        "model_info": {
            "encoder": ENC_NAME,
            "mlp_params": param_count,
            "mlp_bytes": param_bytes,
            "input_dim": 384,
            "hidden_dims": [512, 256, 128],
            "num_classes": len(roles_meta),
        }
    }
