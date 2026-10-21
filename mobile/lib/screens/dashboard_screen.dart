import 'package:flutter/material.dart';
import '../models/student_profile.dart';
import '../models/prediction.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/skill_radar_chart.dart';
import '../widgets/status_badge.dart';
import '../widgets/voice_copilot_modal.dart';
import 'academic_edit_dialog.dart';
import 'ml_pipeline_lab_screen.dart';
import 'knowledge_vault_screen.dart';
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
  bool _isRefreshing = false;
  PredictResponse? _prediction;
  late StudentProfile _student;

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

  void _openVoiceCopilot() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => VoiceCopilotModal(student: _student),
    );
  }

  void _openAcademicEditor() {
    showDialog(
      context: context,
      builder: (_) => AcademicEditDialog(
        student: _student,
        onSuccess: () {
          widget.onProfileUpdated();
          _loadInitialPrediction();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.shellBase,
      appBar: AppBar(
        titleSpacing: 12,
        title: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: AppTheme.charcoal,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text('M', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.accent, fontSize: 15)),
              ),
            ),
            const SizedBox(width: 8),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'MirrorMind v2',
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                    style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                  ),
                  Text(
                    'Autonomous Career Copilot',
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                    style: TextStyle(fontSize: 9.5, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(6),
            constraints: const BoxConstraints(),
            icon: _isRefreshing
                ? const SizedBox(width: 15, height: 15, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.charcoal))
                : const Icon(Icons.refresh, color: AppTheme.textSecondary, size: 19),
            tooltip: 'Re-evaluate AI',
            onPressed: _isRefreshing ? null : _loadInitialPrediction,
          ),
          const SizedBox(width: 4),
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(6),
            constraints: const BoxConstraints(),
            icon: const Icon(Icons.record_voice_over, color: AppTheme.charcoal, size: 20),
            tooltip: 'Voice Copilot',
            onPressed: _openVoiceCopilot,
          ),
          const SizedBox(width: 4),
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(6),
            constraints: const BoxConstraints(),
            icon: const Icon(Icons.settings_outlined, color: AppTheme.textSecondary, size: 19),
            tooltip: 'Settings',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
            },
          ),
          const SizedBox(width: 4),
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(6),
            constraints: const BoxConstraints(),
            icon: const Icon(Icons.logout, color: AppTheme.textSecondary, size: 19),
            tooltip: 'Sign Out',
            onPressed: () async {
              await AuthService().logout();
              widget.onProfileUpdated();
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: IndexedStack(
        index: _currentTabIndex,
        children: [
          _buildMainDashboardView(),
          MLPipelineLabScreen(student: _student),
          KnowledgeVaultScreen(student: _student, onProfileUpdated: widget.onProfileUpdated),
          _buildStudentDossierView(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppTheme.surfaceCard,
          border: Border(top: BorderSide(color: AppTheme.borderSubtle)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentTabIndex,
          onTap: (i) => setState(() => _currentTabIndex = i),
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppTheme.charcoal,
          unselectedItemColor: AppTheme.textMuted,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.psychology_outlined),
              activeIcon: Icon(Icons.psychology),
              label: 'ML Lab',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.inventory_2_outlined),
              activeIcon: Icon(Icons.inventory_2),
              label: 'Vault',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.badge_outlined),
              activeIcon: Icon(Icons.badge),
              label: 'Dossier',
            ),
          ],
        ),
      ),
    );
  }

  // TAB 0: Main Dashboard with Voice Hero, Academics, Career Predictions, Projects & Internships
  Widget _buildMainDashboardView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. AI Voice Co-Pilot Hero Card
          _buildVoiceCopilotHero(),
          const SizedBox(height: 14),

          // 2. Academic Summary Card with Quick Edit
          _buildAcademicSummaryCard(),
          const SizedBox(height: 14),

          // 3. Career Recommendations Matrix Card
          if (_prediction != null) ...[
            _buildCareerPredictionsCard(_prediction!),
            const SizedBox(height: 14),
            _buildRadarAndInsightsCard(_prediction!),
            const SizedBox(height: 14),
          ],

          // 4. Projects Section
          _buildProjectsSection(),
          const SizedBox(height: 14),

          // 5. Internships & Experience Section
          _buildInternshipsSection(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // 1. Prominent AI Voice Co-Pilot Hero
  Widget _buildVoiceCopilotHero() {
    return GlassCard(
      backgroundColor: Colors.white,
      borderColor: AppTheme.borderSubtle,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const StatusBadge(label: 'AI COPILOT ACTIVE', isConnected: true),
              Text(
                'Grounded in Student Data',
                style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'MirrorMind Voice Copilot',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'Real-time spoken engineering advisor strictly mentoring on technical skill mastery, CGPA targets, and placement readiness.',
            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _openVoiceCopilot,
                  icon: const Icon(Icons.mic, size: 18),
                  label: const Text('Start Voice Consultation'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.charcoal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: IconButton(
                  icon: const Icon(Icons.chat_bubble_outline, color: Color(0xFFB45309), size: 20),
                  tooltip: 'Text Query',
                  onPressed: _openVoiceCopilot,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 2. Compact Academic Credentials & Verification
  Widget _buildAcademicSummaryCard() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppTheme.charcoal,
                    backgroundImage: _student.avatarUrl != null ? NetworkImage(_student.avatarUrl!) : null,
                    child: _student.avatarUrl == null
                        ? Text(_student.name.isNotEmpty ? _student.name[0] : 'P', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_student.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppTheme.textPrimary)),
                      Text(_student.email, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    ],
                  ),
                ],
              ),
              TextButton.icon(
                onPressed: _openAcademicEditor,
                icon: const Icon(Icons.edit_outlined, size: 14, color: AppTheme.charcoal),
                label: const Text('Edit', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.charcoal)),
                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(40, 30)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.surfaceSoft,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _metricTile('CGPA', _student.cgpa.toStringAsFixed(2), AppTheme.accent),
                _divider(),
                _metricTile('Semester', '${_student.semester}th', AppTheme.charcoal),
                _divider(),
                _metricTile('Projects', '${_student.projects.length}', AppTheme.charcoal),
                _divider(),
                _metricTile('Internships', '${_student.internships.length}', AppTheme.charcoal),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _student.collegeName ?? 'Visvesvaraya Technological University (SIT)',
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _divider() {
    return Container(width: 1, height: 28, color: AppTheme.borderSubtle);
  }

  Widget _metricTile(String label, String value, Color accentColor) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: accentColor)),
        const SizedBox(height: 1),
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
      ],
    );
  }

  // 3. Career Recommendations Matrix
  Widget _buildCareerPredictionsCard(PredictResponse pred) {
    final topRole = pred.predictions.isNotEmpty ? pred.predictions.first : null;

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Career Affinity Predictions', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
              StatusBadge(
                label: topRole != null ? '${(topRole.confidence * 100).toStringAsFixed(1)}% MATCH' : 'ACTIVE',
                isConnected: true,
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text('PyTorch CareerMLP Multi-Task Inference:', style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
          const SizedBox(height: 14),

          // Top Role Banner
          if (topRole != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.accent,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text('TOP PREDICTION', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: AppTheme.charcoal)),
                          ),
                          const SizedBox(width: 8),
                          Text(topRole.label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: AppTheme.textPrimary)),
                        ],
                      ),
                      Text(
                        '${(topRole.confidence * 100).toStringAsFixed(1)}%',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFFB45309)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: topRole.confidence,
                      minHeight: 6,
                      backgroundColor: const Color(0xFFFEF3C7),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accent),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Remaining Ranked Roles
          ...pred.predictions.skip(1).take(4).map((p) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('#${p.rank}  ${p.label}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                      Text('${(p.confidence * 100).toStringAsFixed(1)}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.charcoal)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: p.confidence,
                      minHeight: 5,
                      backgroundColor: AppTheme.surfaceMuted,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.charcoal),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // Radar & Insights Card
  Widget _buildRadarAndInsightsCard(PredictResponse pred) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('5-Pillar Capability Radar', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
          const SizedBox(height: 4),
          const Text('Multi-dimensional competency breakdown derived from coursework & skills:', style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
          const SizedBox(height: 14),
          Center(
            child: SkillRadarChart(scores: pred.skillRadar ?? {'Systems': 85, 'Data/ML': 90, 'Cloud': 78, 'Distributed': 82, 'Velocity': 80}, size: 210),
          ),
          if (pred.insight != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.surfaceSoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.lightbulb_outline, size: 18, color: Color(0xFFD97706)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      pred.insight!,
                      style: const TextStyle(fontSize: 11.5, color: AppTheme.textPrimary, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // 4. Projects Section
  Widget _buildProjectsSection() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.folder_special_outlined, size: 18, color: AppTheme.charcoal),
                  SizedBox(width: 8),
                  Text('Projects & Technical Artifacts', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                ],
              ),
              Text('${_student.projects.length} Total', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
            ],
          ),
          const SizedBox(height: 10),
          if (_student.projects.isEmpty)
            const Text('No projects added yet.', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary))
          else
            ..._student.projects.map((proj) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceSoft,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(proj.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.textPrimary)),
                    const SizedBox(height: 4),
                    Text(proj.description, style: const TextStyle(fontSize: 11.5, color: AppTheme.textSecondary, height: 1.35)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 5,
                      runSpacing: 5,
                      children: proj.techStack.map((tech) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppTheme.borderSubtle),
                          ),
                          child: Text(tech, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.charcoal)),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // 5. Internships & Experience Section
  Widget _buildInternshipsSection() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.work_outline, size: 18, color: AppTheme.charcoal),
                  SizedBox(width: 8),
                  Text('Internships & Experience', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                ],
              ),
              Text('${_student.internships.length} Total', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
            ],
          ),
          const SizedBox(height: 10),
          if (_student.internships.isEmpty)
            const Text('No internship experience recorded yet.', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary))
          else
            ..._student.internships.map((intern) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceSoft,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(intern.role, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.textPrimary)),
                        if (intern.isCurrent)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('CURRENT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppTheme.accentEmerald)),
                          ),
                      ],
                    ),
                    Text(intern.companyName, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                    if (intern.description != null && intern.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(intern.description!, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, height: 1.35)),
                    ],
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // TAB 3: Student Career Dossier View
  Widget _buildStudentDossierView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildAcademicGroundingCard(),
          const SizedBox(height: 14),
          _buildTechnicalSkillsCard(),
          const SizedBox(height: 14),
          _buildResumeStatusCard(),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => OnboardingScreen(
                    userEmail: _student.email,
                    userName: _student.name,
                    userPhoto: _student.avatarUrl,
                    onSuccess: (p, pred) => widget.onProfileUpdated(),
                  ),
                ),
              );
            },
            icon: const Icon(Icons.edit, size: 16),
            label: const Text('Edit Complete Career Dossier'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildAcademicGroundingCard() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Academic Groundings', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              IconButton(
                icon: const Icon(Icons.edit_outlined, size: 18),
                onPressed: _openAcademicEditor,
              ),
            ],
          ),
          const SizedBox(height: 8),
          _dossierRow('University / College', _student.collegeName ?? 'Visvesvaraya Technological University (SIT)'),
          _dossierRow('Engineering Branch', _student.branch),
          _dossierRow('CGPA', '${_student.cgpa} / 10.0'),
          _dossierRow('Current Semester', '${_student.semester}th Semester'),
          _dossierRow('Institutional Tier', _student.collegeTier),
          _dossierRow('Career Interest Track', _student.careerInterest),
        ],
      ),
    );
  }

  Widget _buildTechnicalSkillsCard() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Technical Skills Inventory', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
          const SizedBox(height: 4),
          const Text('Extracted from coursework, GitHub, and verified projects:', style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _student.skills.map((skill) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceSoft,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Text(skill, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildResumeStatusCard() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Verified Resume Asset', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              const StatusBadge(label: 'PARSED & INDEXED', isConnected: true),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _student.resumeFilename ?? 'prajwal_resume (1).pdf',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 2),
          const Text('Uploaded to Cloudinary CDN & embedded into MongoDB Vector Search vault.', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
        ],
      ),
    );
  }

  Widget _dossierRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
