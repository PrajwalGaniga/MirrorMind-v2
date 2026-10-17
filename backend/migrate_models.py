import os
import shutil
import zipfile
from pathlib import Path

SRC_DIR = Path(r"c:\Users\Prajwal\Desktop\projects\MirrorMind_v2\temp")
DEST_DIR = Path(r"c:\Users\Prajwal\Desktop\projects\MirrorMind_v2\backend\app\ml_models")

DEST_DIR.mkdir(parents=True, exist_ok=True)

# 1. Copy config files
for fname in ["nn_arch.json", "label_encoder.pkl", "embedding_model.txt", "best_model_name.txt"]:
    src_file = SRC_DIR / fname
    if src_file.exists():
        shutil.copy2(src_file, DEST_DIR / fname)
        print(f"Copied {fname} -> {DEST_DIR / fname}")

# 2. Process PyTorch weights
# In PyTorch, a .pt file is a zip archive. Let's see if nn_best.pt.zip is the .pt file directly or if it contains it.
zip_path = SRC_DIR / "nn_best.pt.zip"
if zip_path.exists():
    # Also copy as nn_best.pt directly
    dest_pt = DEST_DIR / "nn_best.pt"
    shutil.copy2(zip_path, dest_pt)
    print(f"Copied {zip_path} -> {dest_pt}")

print("Model migration completed successfully.")
