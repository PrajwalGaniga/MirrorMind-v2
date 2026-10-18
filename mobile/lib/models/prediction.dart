class PredictionItem {
  final int rank;
  final String role;
  final String label;
  final double confidence;

  PredictionItem({
    required this.rank,
    required this.role,
    required this.label,
    required this.confidence,
  });

  factory PredictionItem.fromJson(Map<String, dynamic> json) {
    return PredictionItem(
      rank: json['rank'] ?? 1,
      role: json['role'] ?? '',
      label: json['label'] ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class NNLayerSpec {
  final String id;
  final String name;
  final String type;
  final List<int> inputShape;
  final List<int> outputShape;
  final String activation;
  final String? regularization;
  final String description;

  NNLayerSpec({
    required this.id,
    required this.name,
    required this.type,
    required this.inputShape,
    required this.outputShape,
    required this.activation,
    this.regularization,
    required this.description,
  });

  factory NNLayerSpec.fromJson(Map<String, dynamic> json) {
    return NNLayerSpec(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? '',
      inputShape: (json['input_shape'] as List<dynamic>?)?.map((e) => (e as num).toInt()).toList() ?? [],
      outputShape: (json['output_shape'] as List<dynamic>?)?.map((e) => (e as num).toInt()).toList() ?? [],
      activation: json['activation'] ?? '',
      regularization: json['regularization'],
      description: json['description'] ?? '',
    );
  }
}

class PredictResponse {
  final String profileText;
  final String topPrediction;
  final String topLabel;
  final double confidence;
  final List<PredictionItem> predictions;
  final String? topInsight;
  final Map<String, int>? skillRadar;
  final int embeddingDim;
  final List<double>? embeddingPreview;
  final Map<String, double>? allProbabilities;
  final List<NNLayerSpec>? nnLayers;

  PredictResponse({
    required this.profileText,
    required this.topPrediction,
    required this.topLabel,
    required this.confidence,
    required this.predictions,
    this.topInsight,
    this.skillRadar,
    this.embeddingDim = 384,
    this.embeddingPreview,
    this.allProbabilities,
    this.nnLayers,
  });

  String? get insight => topInsight;

  factory PredictResponse.fromJson(Map<String, dynamic> json) {
    return PredictResponse(
      profileText: json['profile_text'] ?? '',
      topPrediction: json['top_prediction'] ?? '',
      topLabel: json['top_label'] ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      predictions: (json['predictions'] as List<dynamic>?)
              ?.map((e) => PredictionItem.fromJson(Map<String, dynamic>.from(e)))
              .toList() ??
          [],
      topInsight: json['top_insight'],
      skillRadar: (json['skill_radar'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, (v as num).toInt())),
      embeddingDim: json['embedding_dim'] ?? 384,
      embeddingPreview: (json['embedding_preview'] as List<dynamic>?)
          ?.map((e) => (e as num).toDouble())
          .toList(),
      allProbabilities: (json['all_probabilities'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, (v as num).toDouble())),
      nnLayers: (json['nn_layers'] as List<dynamic>?)
          ?.map((e) => NNLayerSpec.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
    );
  }
}
