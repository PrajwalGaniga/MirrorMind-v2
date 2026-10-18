class RolePrediction {
  final int rank;
  final String role;
  final String label;
  final double confidence;

  RolePrediction({
    required this.rank,
    required this.role,
    required this.label,
    required this.confidence,
  });

  factory RolePrediction.fromJson(Map<String, dynamic> json) {
    return RolePrediction(
      rank: json['rank'] ?? 0,
      role: json['role'] ?? '',
      label: json['label'] ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'rank': rank,
    'role': role,
    'label': label,
    'confidence': confidence,
  };
}

class RoleMeta {
  final String token;
  final String label;
  final int index;

  RoleMeta({
    required this.token,
    required this.label,
    required this.index,
  });

  factory RoleMeta.fromJson(Map<String, dynamic> json) {
    return RoleMeta(
      token: json['token'] ?? '',
      label: json['label'] ?? '',
      index: json['index'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'token': token,
    'label': label,
    'index': index,
  };
}

class TraceLatency {
  final double tokenize;
  final double encode;
  final double mlp;
  final double total;

  TraceLatency({
    required this.tokenize,
    required this.encode,
    required this.mlp,
    required this.total,
  });

  factory TraceLatency.fromJson(Map<String, dynamic> json) {
    return TraceLatency(
      tokenize: (json['tokenize'] as num?)?.toDouble() ?? 0.0,
      encode: (json['encode'] as num?)?.toDouble() ?? 0.0,
      mlp: (json['mlp'] as num?)?.toDouble() ?? 0.0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ModelInfo {
  final String encoder;
  final int mlpParams;
  final int mlpBytes;
  final int inputDim;
  final List<int> hiddenDims;
  final int numClasses;

  ModelInfo({
    required this.encoder,
    required this.mlpParams,
    required this.mlpBytes,
    required this.inputDim,
    required this.hiddenDims,
    required this.numClasses,
  });

  factory ModelInfo.fromJson(Map<String, dynamic> json) {
    return ModelInfo(
      encoder: json['encoder'] ?? 'sentence-transformers/all-MiniLM-L6-v2',
      mlpParams: json['mlp_params'] ?? 246538,
      mlpBytes: json['mlp_bytes'] ?? 986152,
      inputDim: json['input_dim'] ?? 384,
      hiddenDims: (json['hidden_dims'] as List<dynamic>?)?.map((e) => (e as num).toInt()).toList() ?? [512, 256, 128],
      numClasses: json['num_classes'] ?? 10,
    );
  }
}

class TraceActivations {
  final List<double> layer1;
  final List<double> layer2;
  final List<double> layer3;

  TraceActivations({
    required this.layer1,
    required this.layer2,
    required this.layer3,
  });

  factory TraceActivations.fromJson(Map<String, dynamic> json) {
    List<double> parseList(dynamic raw) {
      if (raw is List) {
        return raw.map((e) => (e as num).toDouble()).toList();
      }
      return [];
    }

    return TraceActivations(
      layer1: parseList(json['layer1']),
      layer2: parseList(json['layer2']),
      layer3: parseList(json['layer3']),
    );
  }
}

class TraceResponse {
  final String narrative;
  final List<String> tokens;
  final List<String> allTokens;
  final int tokenCount;
  final List<List<double>> attention;
  final List<double> pooled;
  final List<double> embedding;
  final double embeddingNorm;
  final TraceActivations activations;
  final List<double> logits;
  final List<double> probs;
  final List<RoleMeta> roles;
  final List<RolePrediction> predictions;
  final TraceLatency latencyMs;
  final ModelInfo modelInfo;

  TraceResponse({
    required this.narrative,
    required this.tokens,
    required this.allTokens,
    required this.tokenCount,
    required this.attention,
    required this.pooled,
    required this.embedding,
    required this.embeddingNorm,
    required this.activations,
    required this.logits,
    required this.probs,
    required this.roles,
    required this.predictions,
    required this.latencyMs,
    required this.modelInfo,
  });

  factory TraceResponse.fromJson(Map<String, dynamic> json) {
    List<double> parseList(dynamic raw) {
      if (raw is List) return raw.map((e) => (e as num).toDouble()).toList();
      return [];
    }

    List<List<double>> parse2DList(dynamic raw) {
      if (raw is List) {
        return raw.map((sub) => parseList(sub)).toList();
      }
      return [];
    }

    return TraceResponse(
      narrative: json['narrative'] ?? '',
      tokens: (json['tokens'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      allTokens: (json['all_tokens'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      tokenCount: json['token_count'] ?? 0,
      attention: parse2DList(json['attention']),
      pooled: parseList(json['pooled']),
      embedding: parseList(json['embedding']),
      embeddingNorm: (json['embedding_norm'] as num?)?.toDouble() ?? 1.0,
      activations: TraceActivations.fromJson(json['activations'] ?? {}),
      logits: parseList(json['logits']),
      probs: parseList(json['probs']),
      roles: (json['roles'] as List<dynamic>?)?.map((e) => RoleMeta.fromJson(e)).toList() ?? [],
      predictions: (json['predictions'] as List<dynamic>?)?.map((e) => RolePrediction.fromJson(e)).toList() ?? [],
      latencyMs: TraceLatency.fromJson(json['latency_ms'] ?? {}),
      modelInfo: ModelInfo.fromJson(json['model_info'] ?? {}),
    );
  }
}

class PresetProfile {
  final String id;
  final String name;
  final String roleTitle;
  final String tagline;
  final List<String> skills;
  final double cgpa;
  final int projectsCount;
  final int internshipsCount;

  const PresetProfile({
    required this.id,
    required this.name,
    required this.roleTitle,
    required this.tagline,
    required this.skills,
    required this.cgpa,
    required this.projectsCount,
    required this.internshipsCount,
  });

  static const List<PresetProfile> allPresets = [
    PresetProfile(
      id: 'prajwal_profile',
      name: 'Prajwal Ganiga',
      roleTitle: 'AI/ML & Distributed Systems',
      tagline: 'PyTorch, Transformers, FastAPI, Distributed Vector Databases, Flutter',
      skills: ['Python', 'PyTorch', 'Transformers', 'FastAPI', 'MongoDB', 'Docker', 'Flutter', 'TensorFlow', 'REST APIs', 'Cloud Computing'],
      cgpa: 9.25,
      projectsCount: 4,
      internshipsCount: 2,
    ),
    PresetProfile(
      id: 'fullstack_polyglot',
      name: 'Priya Sharma',
      roleTitle: 'Full-Stack & Systems Polyglot',
      tagline: 'TypeScript, Go, React, Distributed Caching, PostgreSQL',
      skills: ['Go', 'TypeScript', 'React', 'PostgreSQL', 'Redis', 'Docker', 'GraphQL', 'Next.js', 'Kubernetes'],
      cgpa: 8.85,
      projectsCount: 5,
      internshipsCount: 2,
    ),
    PresetProfile(
      id: 'applied_ai_data',
      name: 'Alex Chen',
      roleTitle: 'Applied AI & Data Scientist',
      tagline: 'PyTorch, Scikit-learn, LangChain, Feature Engineering, MLOps',
      skills: ['Python', 'PyTorch', 'Scikit-learn', 'LangChain', 'Pandas', 'NumPy', 'MLflow', 'HuggingFace'],
      cgpa: 9.10,
      projectsCount: 4,
      internshipsCount: 1,
    ),
    PresetProfile(
      id: 'devops_cloud_sre',
      name: 'Marcus Vance',
      roleTitle: 'DevOps & Cloud SRE',
      tagline: 'Terraform, AWS, Kubernetes, Prometheus, CI/CD',
      skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'Prometheus', 'Grafana', 'Linux', 'Python', 'Bash'],
      cgpa: 8.35,
      projectsCount: 3,
      internshipsCount: 2,
    ),
    PresetProfile(
      id: 'creative_frontend',
      name: 'Sophia Lin',
      roleTitle: 'Frontend & Creative Technologist',
      tagline: 'Three.js, WebGL, Next.js, Design Systems, Flutter Web',
      skills: ['TypeScript', 'React', 'Three.js', 'CSS', 'Tailwind', 'Next.js', 'Figma', 'WebGL', 'Flutter'],
      cgpa: 8.70,
      projectsCount: 6,
      internshipsCount: 1,
    ),
  ];
}
