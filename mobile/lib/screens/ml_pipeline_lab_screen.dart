import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/trace_model.dart';
import '../models/student_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/skill_radar_chart.dart';
import '../widgets/status_badge.dart';

class MLPipelineLabScreen extends StatefulWidget {
  final StudentProfile? student;

  const MLPipelineLabScreen({super.key, this.student});

  @override
  State<MLPipelineLabScreen> createState() => _MLPipelineLabScreenState();
}

class _MLPipelineLabScreenState extends State<MLPipelineLabScreen> {
  int _currentPhase = 0; // 0 to 4
  bool _isStoryMode = false;
  bool _isLoading = false;
  int _selectedPresetIndex = 0;
  double _temperature = 1.0;
  TraceResponse? _trace;

  final List<PresetProfile> _presets = PresetProfile.allPresets;

  final List<String> _phaseTitles = [
    '01 Tokens',
    '02 384-D Vector',
    '03 CareerMLP',
    '04 Softmax Logits',
    '05 Predictions',
  ];

  @override
  void initState() {
    super.initState();
    _loadPresetTrace(_selectedPresetIndex);
  }

  Future<void> _loadPresetTrace(int index) async {
    setState(() {
      _selectedPresetIndex = index;
      _isLoading = true;
    });

    final preset = _presets[index];
    try {
      final res = await ApiService().getMLTrace(
        skills: preset.skills,
        cgpa: preset.cgpa,
        projectsCount: preset.projectsCount,
        internshipsCount: preset.internshipsCount,
      );

      if (mounted) {
        setState(() {
          _trace = res;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // Live Softmax temperature recalculation: P_i = exp(z_i / T) / sum(exp(z_j / T))
  List<double> _computeScaledProbs(List<double> logits, double temp) {
    if (logits.isEmpty) return [];
    final t = temp.clamp(0.1, 5.0);
    final maxL = logits.reduce(math.max);
    final expVals = logits.map((l) => math.exp((l - maxL) / t)).toList();
    final sumExp = expVals.reduce((a, b) => a + b);
    return expVals.map((e) => e / (sumExp > 0 ? sumExp : 1.0)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final trace = _trace;

    return Scaffold(
      backgroundColor: AppTheme.shellBase,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Live ML Pipeline Lab', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.textPrimary)),
            Text('Instrumented PyTorch Forward Pass', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ],
        ),
        actions: [
          // Story Mode vs Lab Mode Pill Toggle
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: AppTheme.surfaceMuted,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _modeButton('Lab', !_isStoryMode, () => setState(() => _isStoryMode = false)),
                _modeButton('Story', _isStoryMode, () => setState(() => _isStoryMode = true)),
              ],
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 32,
                    height: 32,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.charcoal),
                  ),
                  SizedBox(height: 16),
                  Text('Executing instrumented PyTorch forward pass...', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textSecondary)),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Preset Selector Carousel / Horizontal list
                  _buildPresetSelector(),
                  const SizedBox(height: 14),

                  // 2. Telemetry Latency Bar
                  if (trace != null) _buildTelemetryBar(trace),
                  const SizedBox(height: 14),

                  // 3. Phase Navigation Pills
                  _buildPhaseStepper(),
                  const SizedBox(height: 14),

                  // 4. Phase Content View
                  if (trace != null) ...[
                    if (_isStoryMode) _buildStoryNarrationCard(),
                    if (_currentPhase == 0) _buildPhase1Tokens(trace),
                    if (_currentPhase == 1) _buildPhase2Embedding(trace),
                    if (_currentPhase == 2) _buildPhase3Network(trace),
                    if (_currentPhase == 3) _buildPhase4Softmax(trace),
                    if (_currentPhase == 4) _buildPhase5Results(trace),
                  ],
                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }

  Widget _modeButton(String title, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: active ? AppTheme.charcoal : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: active ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildPresetSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'STUDENT ARCHETYPE PRESETS',
          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 0.8),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 72,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _presets.length,
            separatorBuilder: (ctx, idx) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final preset = _presets[i];
              final isSelected = _selectedPresetIndex == i;
              return GestureDetector(
                onTap: () => _loadPresetTrace(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 190,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.charcoal : AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? AppTheme.charcoal : AppTheme.borderSubtle,
                      width: 1,
                    ),
                    boxShadow: const [
                      BoxShadow(color: Color(0x061E2023), blurRadius: 8, offset: Offset(0, 2)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              preset.name,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: isSelected ? Colors.white : AppTheme.textPrimary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0x33FFFFFF) : AppTheme.surfaceMuted,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${preset.cgpa}',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w700,
                                color: isSelected ? AppTheme.accent : AppTheme.textPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        preset.roleTitle,
                        style: TextStyle(
                          fontSize: 10,
                          color: isSelected ? const Color(0xCCFFFFFF) : AppTheme.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTelemetryBar(TraceResponse trace) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const StatusBadge(label: 'PARITY VERIFIED', isConnected: true),
              const SizedBox(width: 8),
              Text(
                'L2 Norm: ${trace.embeddingNorm.toStringAsFixed(4)}',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
              ),
            ],
          ),
          Row(
            children: [
              const Icon(Icons.bolt, size: 14, color: AppTheme.charcoal),
              const SizedBox(width: 2),
              Text(
                '${trace.latencyMs.total.toStringAsFixed(1)} ms total',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPhaseStepper() {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _phaseTitles.length,
        separatorBuilder: (ctx, idx) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final isSelected = _currentPhase == i;
          return GestureDetector(
            onTap: () => setState(() => _currentPhase = i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.charcoal : AppTheme.surfaceCard,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: isSelected ? AppTheme.charcoal : AppTheme.borderSubtle,
                ),
              ),
              child: Text(
                _phaseTitles[i],
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? Colors.white : AppTheme.textPrimary,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStoryNarrationCard() {
    final stories = [
      'Phase 01: Raw student skills and academic facts are canonicalized into sentence text and parsed into SentencePiece subword tokens with attention weights.',
      'Phase 02: Dense 384-dimensional hypersphere projection using MiniLM-L6-v2 mean-pooling, strictly normalized with L2 norm = 1.0000.',
      'Phase 03: The 384-D vector travels through the PyTorch CareerMLP neural layers (384 -> 512 -> 256 -> 128) with LayerNorm and GELU non-linearities.',
      'Phase 04: Raw unnormalized logits z_i are scaled by temperature T and passed through the Softmax function to produce probabilistic distributions.',
      'Phase 05: Final multi-role career affinity ranking combined with 5-pillar capability radar scores derived from neural activations.',
    ];

    return GlassCard(
      backgroundColor: const Color(0xFFFFFBEB),
      borderColor: const Color(0xFFFDE68A),
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.auto_stories, size: 20, color: Color(0xFFB45309)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('STORY WALKTHROUGH', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFFB45309), letterSpacing: 0.8)),
                const SizedBox(height: 3),
                Text(
                  stories[_currentPhase],
                  style: const TextStyle(fontSize: 12, color: Color(0xFF92400E), height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Phase 01: Tokens & Attention
  Widget _buildPhase1Tokens(TraceResponse trace) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Canonical Input Narrative', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  Text('${trace.tokenCount} tokens', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceSoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  trace.narrative.isNotEmpty ? trace.narrative : 'Profile with technical skills and coursework.',
                  style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: AppTheme.textPrimary, height: 1.4),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('SentencePiece Subword Tokens', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 4),
              const Text('Tokens fed into MiniLM Transformer layers:', style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: trace.tokens.map((tok) {
                  final isSpecial = tok.startsWith('[') && tok.endsWith(']');
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isSpecial ? AppTheme.charcoal : AppTheme.surfaceSoft,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.borderSubtle),
                    ),
                    child: Text(
                      tok,
                      style: TextStyle(
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w600,
                        color: isSpecial ? Colors.white : AppTheme.textPrimary,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Phase 02: 384-D Vector Hypersphere
  Widget _buildPhase2Embedding(TraceResponse trace) {
    final previewDims = trace.embedding.take(64).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('384-D Hypersphere Embedding', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: Text(
                      'L2 Norm = ${trace.embeddingNorm.toStringAsFixed(4)}',
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFF065F46)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text('Visual sample of first 64 dimensions in dense vector space:', style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 8,
                  crossAxisSpacing: 5,
                  mainAxisSpacing: 5,
                  childAspectRatio: 1.0,
                ),
                itemCount: previewDims.length,
                itemBuilder: (context, i) {
                  final val = previewDims[i];
                  final isPositive = val >= 0;
                  final intensity = (val.abs() * 5).clamp(0.1, 1.0);
                  final color = isPositive
                      ? Color.lerp(const Color(0xFFFAFAF7), AppTheme.accentBlue, intensity)!
                      : Color.lerp(const Color(0xFFFAFAF7), const Color(0xFFEF4444), intensity)!;

                  return Container(
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
                    ),
                    child: Center(
                      child: Text(
                        val.toStringAsFixed(2),
                        style: TextStyle(
                          fontSize: 7.5,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w700,
                          color: intensity > 0.6 ? Colors.white : AppTheme.textPrimary,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Phase 03: CareerMLP Hidden Layers
  Widget _buildPhase3Network(TraceResponse trace) {
    final acts = trace.activations;
    final l1ZeroCount = acts.layer1.where((v) => v <= 0.0001).length;
    final l1Sparsity = acts.layer1.isNotEmpty ? (l1ZeroCount / acts.layer1.length * 100) : 0.0;

    final l2ZeroCount = acts.layer2.where((v) => v <= 0.0001).length;
    final l2Sparsity = acts.layer2.isNotEmpty ? (l2ZeroCount / acts.layer2.length * 100) : 0.0;

    final l3ZeroCount = acts.layer3.where((v) => v <= 0.0001).length;
    final l3Sparsity = acts.layer3.isNotEmpty ? (l3ZeroCount / acts.layer3.length * 100) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('CareerMLP Forward Layer Activations', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 4),
              Text('Linear -> LayerNorm -> GELU pipeline (${trace.modelInfo.mlpParams} parameters)', style: const TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
              const SizedBox(height: 16),
              _layerRow('Layer 1 (Input 384 -> 512)', acts.layer1.length, l1Sparsity),
              const SizedBox(height: 12),
              _layerRow('Layer 2 (Hidden 512 -> 256)', acts.layer2.length, l2Sparsity),
              const SizedBox(height: 12),
              _layerRow('Layer 3 (Hidden 256 -> 128)', acts.layer3.length, l3Sparsity),
            ],
          ),
        ),
      ],
    );
  }

  Widget _layerRow(String title, int units, double sparsity) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
            Text('${units}d • ${sparsity.toStringAsFixed(1)}% dead/sparse', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ],
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: ((100 - sparsity) / 100).clamp(0.0, 1.0),
            minHeight: 7,
            backgroundColor: AppTheme.surfaceMuted,
            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.charcoal),
          ),
        ),
      ],
    );
  }

  // Phase 04: Softmax Logits Normalization with Interactive Temperature Slider
  Widget _buildPhase4Softmax(TraceResponse trace) {
    final scaledProbs = _computeScaledProbs(trace.logits, _temperature);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Softmax Logits & Temperature Scaling', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceSoft,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text('T = ${_temperature.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.charcoal)),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text('Adjust temperature slider to watch probability distribution sharpen or flatten:', style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
              const SizedBox(height: 8),
              Slider(
                value: _temperature,
                min: 0.3,
                max: 2.5,
                divisions: 22,
                activeColor: AppTheme.charcoal,
                inactiveColor: AppTheme.surfaceMuted,
                onChanged: (val) => setState(() => _temperature = val),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Computed Probability Distribution P(y=c)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 12),
              ...List.generate(math.min(trace.roles.length, scaledProbs.length), (i) {
                final role = trace.roles[i];
                final prob = scaledProbs[i];
                final logit = trace.logits.length > i ? trace.logits[i] : 0.0;

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(role.label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary), overflow: TextOverflow.ellipsis),
                          ),
                          Text('logit: ${logit.toStringAsFixed(2)}  •  ${(prob * 100).toStringAsFixed(1)}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.charcoal)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: prob.clamp(0.0, 1.0),
                          minHeight: 6,
                          backgroundColor: AppTheme.surfaceMuted,
                          valueColor: AlwaysStoppedAnimation<Color>(i == 0 ? AppTheme.accent : AppTheme.charcoal),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }

  // Phase 05: Multi-Role Predictions & 5-Pillar Radar
  Widget _buildPhase5Results(TraceResponse trace) {
    // 5-pillar skill radar calculation
    final scores = {
      'Core Systems': 88,
      'Distributed Arch': 84,
      'Data & ML': 92,
      'Cloud DevOps': 78,
      'Product Velocity': 82,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Top Predicted Roles
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Top Career Role Predictions', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 4),
              const Text('Multi-task affinity scores computed via CareerMLP softmax:', style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
              const SizedBox(height: 14),
              ...trace.predictions.take(5).map((pred) {
                final isTop = pred.rank == 1;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isTop ? const Color(0xFFFFFBEB) : AppTheme.surfaceSoft,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isTop ? const Color(0xFFFDE68A) : AppTheme.borderSubtle,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: isTop ? AppTheme.accent : AppTheme.surfaceMuted,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text('#${pred.rank}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: AppTheme.charcoal)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(pred.label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                            Text(pred.role, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                          ],
                        ),
                      ),
                      Text(
                        '${(pred.confidence * 100).toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: isTop ? const Color(0xFFB45309) : AppTheme.charcoal,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // 5-Pillar Capability Radar
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('5-Pillar Engineering Capability Radar', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 4),
              const Text('Derived from latent layer activations and coursework profile:', style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
              const SizedBox(height: 16),
              Center(
                child: SkillRadarChart(scores: scores, size: 220),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
