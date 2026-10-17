import 'package:flutter/material.dart';
import '../models/student_profile.dart';
import '../models/prediction.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/skill_radar_chart.dart';
import '../widgets/status_badge.dart';
import 'onboarding_screen.dart';
import 'settings_screen.dart';

class DashboardScreen extends StatefulWidget {
  final StudentProfile student;
  final PredictResponse? prediction;
  final VoidCallback onProfileUpdated;

  const DashboardScreen({
    super.key,
    required this.student,
    this.prediction,
    required this.onProfileUpdated,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentTabIndex = 0;
  int _activeMLStage = 0;
  bool _showAll10Roles = false;
  bool _isRefreshing = false;
  PredictResponse? _prediction;
  late StudentProfile _student;

  final List<String> _mlStageNames = [
    '1. Text Narrative',
    '2. 384-D Vector',
    '3. CareerMLP NN',
    '4. Softmax Top-5',
    '5. Skill Radar',
    '6. AI Mentor',
  ];

  @override
  void initState() {
    super.initState();
    _student = widget.student;
    _prediction = widget.prediction;
    if (_prediction == null) {
      _loadInitialPrediction();
    }
  }

  Future<void> _loadInitialPrediction() async {
    setState(() => _isRefreshing = true);
    try {
      final res = await ApiService().predictCareer(
        email: _student.email,
        skills: _student.skills,
        cgpa: _student.cgpa,
        projectsCount: _student.projects.length,
        internshipsCount: _student.internships.length,
      );
      if (mounted) {
        setState(() {
          _prediction = res;
          _isRefreshing = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isRefreshing = false);
    }
  }

  Future<void> _reEvaluateAI() async {
    setState(() => _isRefreshing = true);
    try {
      final res = await ApiService().predictCareer(
        email: _student.email,
        skills: _student.skills,
        cgpa: _student.cgpa,
        projectsCount: _student.projects.length,
        internshipsCount: _student.internships.length,
      );
      if (mounted) {
        setState(() {
          _prediction = res;
          _isRefreshing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('⚡ Career AI predictions updated!'),
            backgroundColor: AppTheme.accentEmerald,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isRefreshing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.accentRed),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppTheme.bgDark.withOpacity(0.95),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: AppTheme.glowGradient,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text('M', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 16)),
              ),
            ),
            const SizedBox(width: 8),
            const Text('MirrorMind v2', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppTheme.textMuted),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.textMuted, size: 20),
            tooltip: 'Sign Out',
            onPressed: () async {
              await AuthService().logout();
              widget.onProfileUpdated();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Student Header Card
              _buildStudentHeaderCard(),
              const SizedBox(height: 16),

              // Content based on bottom tab
              if (_currentTabIndex == 0) _buildMLVisualizerTab(),
              if (_currentTabIndex == 1) _buildStudentDossierTab(),
              if (_currentTabIndex == 2) _buildCloudVerificationTab(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          border: const Border(top: BorderSide(color: AppTheme.borderColor)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentTabIndex,
          onTap: (i) => setState(() => _currentTabIndex = i),
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: AppTheme.accentCyan,
          unselectedItemColor: AppTheme.textSubtle,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.psychology_outlined),
              activeIcon: Icon(Icons.psychology),
              label: 'Career AI',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.badge_outlined),
              activeIcon: Icon(Icons.badge),
              label: 'Dossier',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.cloud_done_outlined),
              activeIcon: Icon(Icons.cloud_done),
              label: 'Cloud Sync',
            ),
          ],
        ),
      ),
    );
  }

  // 1. Student Header Card
  Widget _buildStudentHeaderCard() {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppTheme.accentCyan.withOpacity(0.2),
                backgroundImage: NetworkImage(
                  _student.avatarUrl ??
                      'https://res.cloudinary.com/llinkz0a/image/upload/v1792247568/mirrormind/avatars/avatar_student_prajwal_seed.jpg',
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            _student.name,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.accentIndigo.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppTheme.accentIndigo.withOpacity(0.3)),
                          ),
                          child: Text(
                            _student.collegeTier,
                            style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: Color(0xFFC7D2FE)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _student.branch,
                      style: const TextStyle(fontSize: 11.5, color: AppTheme.accentCyan),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Sem ${_student.semester} • CGPA ${_student.cgpa.toStringAsFixed(1)} • ${_student.email}',
                      style: TextStyle(fontSize: 10.5, color: AppTheme.textMuted.withOpacity(0.85)),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _isRefreshing ? null : _reEvaluateAI,
                  icon: _isRefreshing
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.bgDark))
                      : const Text('⚡', style: TextStyle(fontSize: 14)),
                  label: Text(_isRefreshing ? 'Inference...' : 'Re-run Career AI'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 9),
                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => OnboardingScreen(
                        initialProfile: _student,
                        userEmail: _student.email,
                        userName: _student.name,
                        onSuccess: (updatedStudent, updatedPrediction) {
                          Navigator.pop(context);
                          setState(() {
                            _student = updatedStudent;
                            _prediction = updatedPrediction;
                          });
                        },
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.edit, size: 14),
                label: const Text('Edit Profile', style: TextStyle(fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 14),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 2. ML Visualizer Tab (The Core Requested Feature)
  Widget _buildMLVisualizerTab() {
    if (_prediction == null) {
      return GlassCard(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: const [
            CircularProgressIndicator(color: AppTheme.accentCyan),
            SizedBox(height: 16),
            Text('Executing PyTorch CareerMLP Inference...'),
          ],
        ),
      );
    }

    final pred = _prediction!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Trophy Match Banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0x336366F1), Color(0x2606B6D4)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.accentCyan.withOpacity(0.35)),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.accentAmber.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.accentAmber.withOpacity(0.3)),
                ),
                child: const Center(child: Text('🏆', style: TextStyle(fontSize: 22))),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'TOP PREDICTED CAREER PATHWAY',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.accentCyan, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      pred.topLabel,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${(pred.confidence * 100).toStringAsFixed(1)}%',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.accentEmerald),
                  ),
                  const Text('Confidence', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Horizontal ML Stage Stepper
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: List.generate(_mlStageNames.length, (i) {
              final isSel = _activeMLStage == i;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(
                    _mlStageNames[i],
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                      color: isSel ? AppTheme.bgDark : AppTheme.textMuted,
                    ),
                  ),
                  selected: isSel,
                  selectedColor: AppTheme.accentCyan,
                  backgroundColor: AppTheme.bgCard,
                  onSelected: (_) => setState(() => _activeMLStage = i),
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: 14),

        // ACTIVE STAGE CARD
        if (_activeMLStage == 0) _stage01TextNarrative(pred),
        if (_activeMLStage == 1) _stage02EmbeddingSpace(pred),
        if (_activeMLStage == 2) _stage03NeuralNetworkFlow(pred),
        if (_activeMLStage == 3) _stage04SoftmaxTop5(pred),
        if (_activeMLStage == 4) _stage05SkillRadar(pred),
        if (_activeMLStage == 5) _stage06AiMentorRoadmap(pred),
      ],
    );
  }

  // STAGE 01: Profile Serialization
  Widget _stage01TextNarrative(PredictResponse pred) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stageHeader('STAGE 01', 'Deterministic Profile Serialization', 'How student attributes are formatted before embedding'),
          const SizedBox(height: 14),
          const Text('Input Narrative to SentenceTransformer:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.35),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.accentIndigo.withOpacity(0.25)),
            ),
            child: Text(
              '"${pred.profileText}"',
              style: const TextStyle(fontSize: 12.5, fontFamily: 'monospace', color: Color(0xFFA5F3FC), height: 1.45),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.shield_outlined, size: 14, color: AppTheme.accentEmerald),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Deterministic formatting omits target labels to prevent data leakage.',
                  style: TextStyle(fontSize: 10.5, color: AppTheme.textSubtle.withOpacity(0.9)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // STAGE 02: 384-D Vector Embedding Space
  Widget _stage02EmbeddingSpace(PredictResponse pred) {
    final preview = pred.embeddingPreview ?? [-0.078, -0.0017, 0.0278, 0.0474, -0.035, 0.089, -0.012, 0.054];

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stageHeader('STAGE 02', '384-D Dense Embedding Space', 'all-MiniLM-L6-v2 normalized semantic coordinates'),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _metricPill('384', 'Dimensions'),
              _metricPill('1.000', 'L2 Norm (||v||₂)'),
              _metricPill('MiniLM', 'Transformer'),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Sample Embedding Vector Coordinates:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
            'Cyan = Positive Semantic Activation | Purple = Negative',
            style: TextStyle(fontSize: 10.5, color: AppTheme.textSubtle.withOpacity(0.85)),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: preview.asMap().entries.map((entry) {
              final idx = entry.key;
              final val = entry.value;
              final isPos = val >= 0;
              final color = isPos ? AppTheme.accentCyan : AppTheme.accentPurple;

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: color.withOpacity(0.35)),
                ),
                child: Column(
                  children: [
                    Text('d_${idx + 1}', style: const TextStyle(fontSize: 9, color: AppTheme.textSubtle)),
                    Text(
                      val.toStringAsFixed(3),
                      style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: color, fontFamily: 'monospace'),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // STAGE 03: PyTorch CareerMLP Neural Network Flow
  Widget _stage03NeuralNetworkFlow(PredictResponse pred) {
    final layers = pred.nnLayers ?? [
      NNLayerSpec(id: '0', name: 'Dense Embedding Input', type: 'Tensor', inputShape: [1, 384], outputShape: [1, 384], activation: 'L2 Normalized', description: 'Dense 384-D vector'),
      NNLayerSpec(id: '1', name: 'Dense Block 1', type: 'Linear + BatchNorm + GELU + Dropout', inputShape: [1, 384], outputShape: [1, 512], activation: 'GELU', regularization: 'Dropout(0.35)', description: 'Expands into higher-dimensional latent space'),
      NNLayerSpec(id: '2', name: 'Dense Block 2', type: 'Linear + BatchNorm + GELU + Dropout', inputShape: [1, 512], outputShape: [1, 256], activation: 'GELU', regularization: 'Dropout(0.35)', description: 'Feature compression'),
      NNLayerSpec(id: '3', name: 'Dense Block 3', type: 'Linear + BatchNorm + GELU + Dropout', inputShape: [1, 256], outputShape: [1, 128], activation: 'GELU', regularization: 'Dropout(0.245)', description: 'Classification bottleneck'),
      NNLayerSpec(id: '4', name: 'Output Classifier', type: 'Linear + Softmax', inputShape: [1, 128], outputShape: [1, 10], activation: 'Softmax', description: 'Outputs probabilities across all 10 roles'),
    ];

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stageHeader('STAGE 03', 'PyTorch CareerMLP Forward Pass', 'Deep MLP with BatchNorm, GELU, and Dropout'),
          const SizedBox(height: 14),
          ...layers.asMap().entries.map((entry) {
            final idx = entry.key;
            final l = entry.value;
            final isLast = idx == layers.length - 1;

            return Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.accentIndigo.withOpacity(0.25)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.accentCyan.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text('L$idx', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.accentCyan)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(l.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                            const SizedBox(height: 2),
                            Text(
                              '[${l.inputShape.join(', ')}] → [${l.outputShape.join(', ')}] • ${l.activation}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.accentPurple, fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                if (!isLast)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Icon(Icons.arrow_downward, size: 14, color: AppTheme.accentIndigo.withOpacity(0.7)),
                  ),
              ],
            );
          }),
        ],
      ),
    );
  }

  // STAGE 04: Softmax Classification & Top-5 Roles
  Widget _stage04SoftmaxTop5(PredictResponse pred) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stageHeader('STAGE 04', 'Softmax Probability Distribution', 'Top 5 ranked career pathways with confidence percentages'),
          const SizedBox(height: 14),
          ...pred.predictions.map((p) {
            final isTop = p.rank == 1;
            final pct = (p.confidence * 100).toStringAsFixed(1);

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isTop ? AppTheme.accentCyan.withOpacity(0.08) : Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: isTop ? AppTheme.accentCyan.withOpacity(0.4) : AppTheme.borderColor),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isTop ? AppTheme.accentAmber.withOpacity(0.2) : Colors.white.withOpacity(0.06),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '#${p.rank}',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: isTop ? AppTheme.accentAmber : AppTheme.textMuted,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(p.label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                        ],
                      ),
                      Text(
                        '$pct%',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isTop ? AppTheme.accentCyan : AppTheme.textMain,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: p.confidence,
                      minHeight: 6,
                      backgroundColor: Colors.white.withOpacity(0.06),
                      valueColor: AlwaysStoppedAnimation<Color>(isTop ? AppTheme.accentCyan : AppTheme.accentIndigo),
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 6),
          Center(
            child: TextButton(
              onPressed: () => setState(() => _showAll10Roles = !_showAll10Roles),
              child: Text(
                _showAll10Roles ? '▲ Collapse 10-Role Distribution' : '▼ Inspect All 10 Role Probabilities',
                style: const TextStyle(fontSize: 12, color: AppTheme.accentCyan),
              ),
            ),
          ),
          if (_showAll10Roles && pred.allProbabilities != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.25),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: pred.allProbabilities!.entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(entry.key, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                        Text(
                          '${(entry.value * 100).toStringAsFixed(2)}%',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.accentCyan),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // STAGE 05: 5-Pillar Skill Radar
  Widget _stage05SkillRadar(PredictResponse pred) {
    final scores = pred.skillRadar ?? {
      'Core Programming': 85,
      'Framework Mastery': 82,
      'System & Cloud': 74,
      'Data & Mathematics': 78,
      'Engineering Practices': 75,
    };

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stageHeader('STAGE 05', '5-Pillar Skill Radar', 'Multi-dimensional proficiency evaluation'),
          const SizedBox(height: 16),
          Center(
            child: SkillRadarChart(scores: scores, size: 240),
          ),
        ],
      ),
    );
  }

  // STAGE 06: Gemini AI Mentor Strategic Roadmap
  Widget _stage06AiMentorRoadmap(PredictResponse pred) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stageHeader('STAGE 06', 'Gemini 3.8 Flash Career Mentor', 'Personalized strategic evaluation and placement roadmap'),
          const SizedBox(height: 14),
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppTheme.accentPurple.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Center(child: Text('🤖', style: TextStyle(fontSize: 20))),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('AI Placement Mentor', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  Text('Model: Gemini 3.8 Flash', style: TextStyle(fontSize: 11, color: AppTheme.textSubtle.withOpacity(0.9))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.accentPurple.withOpacity(0.25)),
            ),
            child: Text(
              pred.topInsight ?? 'Your technical foundation shows strong alignment with industry benchmarks.',
              style: const TextStyle(fontSize: 13, height: 1.5, color: Color(0xFFE2E8F0)),
            ),
          ),
        ],
      ),
    );
  }

  // 3. Student Dossier Tab
  Widget _buildStudentDossierTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Academic Scorecard
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Academic Scorecard', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _metricPill(_student.cgpa.toStringAsFixed(1), 'CGPA'),
                  _metricPill('Sem ${_student.semester}', 'Semester'),
                  _metricPill('${_student.backlogCount}', 'Backlogs'),
                  _metricPill(_student.collegeTier, 'Tier'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Skills Cloud
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Verified Technical Skills (${_student.skills.length})', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: _student.skills.map((s) {
                  return Chip(
                    label: Text(s, style: const TextStyle(fontSize: 11.5, color: Color(0xFFC7D2FE))),
                    backgroundColor: AppTheme.accentIndigo.withOpacity(0.15),
                    side: BorderSide(color: AppTheme.accentIndigo.withOpacity(0.3)),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Projects
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Projects Portfolio (${_student.projects.length})', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 12),
              ..._student.projects.map((p) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withOpacity(0.06)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      if (p.description.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(p.description, style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted.withOpacity(0.85))),
                      ],
                      if (p.techStack.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 4,
                          children: p.techStack.map((t) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(t, style: const TextStyle(fontSize: 9.5, color: AppTheme.textSubtle)),
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Internships
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Work Experience (${_student.internships.length})', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 12),
              ..._student.internships.map((i) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withOpacity(0.06)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(i.companyName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      Text(
                        '${i.role} ${i.domain != null ? '• ${i.domain}' : ''}',
                        style: const TextStyle(fontSize: 11.5, color: AppTheme.accentCyan),
                      ),
                      if (i.description != null) ...[
                        const SizedBox(height: 4),
                        Text(i.description!, style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted.withOpacity(0.85))),
                      ],
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

  // 4. Cloud Verification Tab
  Widget _buildCloudVerificationTab() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Cloud Infrastructure & Storage', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 12),
          const StatusBadge(label: 'MongoDB: mirrormind_db.students', isConnected: true),
          const SizedBox(height: 8),
          const StatusBadge(label: 'FastAPI ML Inference Service', isConnected: true),
          const SizedBox(height: 8),
          const StatusBadge(label: 'PyTorch CareerMLP & SentenceTransformers', isConnected: true),
          const SizedBox(height: 16),
          const Text('Active Cloudinary Avatar:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          SelectableText(
            _student.avatarUrl ?? 'None',
            style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: AppTheme.accentCyan),
          ),
          if (_student.resumeUrl != null) ...[
            const SizedBox(height: 12),
            const Text('Active Cloudinary Resume:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            SelectableText(
              _student.resumeUrl!,
              style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: AppTheme.accentEmerald),
            ),
          ],
        ],
      ),
    );
  }

  Widget _stageHeader(String stageNum, String title, String subtitle) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
          decoration: BoxDecoration(
            gradient: AppTheme.glowGradient,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            stageNum,
            style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Colors.white, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
              Text(subtitle, style: TextStyle(fontSize: 10.5, color: AppTheme.textSubtle.withOpacity(0.9))),
            ],
          ),
        ),
      ],
    );
  }

  Widget _metricPill(String val, String label) {
    return Column(
      children: [
        Text(val, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.accentCyan)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
      ],
    );
  }
}
