export interface RolePrediction {
  rank: number;
  role: string;
  label: string;
  confidence: number;
}

export interface RoleMeta {
  token: string;
  label: string;
  index: number;
}

export interface TraceResponse {
  narrative: string;
  tokens: string[];
  all_tokens: string[];
  token_count: number;
  attention: number[][]; // [32 x 32]
  pooled: number[]; // 384
  embedding: number[]; // 384
  embedding_norm: number;
  activations: {
    layer1: number[]; // 512
    layer2: number[]; // 256
    layer3: number[]; // 128
  };
  logits: number[]; // 10
  probs: number[]; // 10
  roles: RoleMeta[];
  predictions: RolePrediction[];
  latency_ms: {
    tokenize: number;
    encode: number;
    mlp: number;
    total: number;
  };
  model_info: {
    encoder: string;
    mlp_params: number;
    mlp_bytes: number;
    input_dim: number;
    hidden_dims: number[];
    num_classes: number;
  };
}

export interface PresetBundle {
  preset_id: string;
  name: string;
  category: string;
  tagline: string;
  input_profile: {
    skills: string[];
    cgpa: number;
    projects_count: number;
    internships_count: number;
  };
  trace: TraceResponse;
}
