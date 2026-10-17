import 'package:flutter/material.dart';
import '../models/student_profile.dart';
import '../models/prediction.dart';
import '../models/resume_parse_result.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/resume_upload_card.dart';

class OnboardingScreen extends StatefulWidget {
  final StudentProfile? initialProfile;
  final String userEmail;
  final String userName;
  final String? userPhoto;
  final Function(StudentProfile profile, PredictResponse prediction) onSuccess;
  final VoidCallback? onCancel;

  const OnboardingScreen({
    super.key,
    this.initialProfile,
    required this.userEmail,
    required this.userName,
    this.userPhoto,
    required this.onSuccess,
    this.onCancel,
  });

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _collegeController;
  late TextEditingController _branchController;
  late TextEditingController _githubController;
  late TextEditingController _linkedinController;
  late TextEditingController _skillInputController;

  String _collegeTier = 'Tier-2';
  int _semester = 6;
  double _cgpa = 8.2;
  int _backlogCount = 0;
  String _careerInterest = 'AIML_ENGINEER';
  int _communicationRating = 4;
  String _workStyle = 'hybrid';
  String _avatarUrl = 'https://res.cloudinary.com/llinkz0a/image/upload/v1792247568/mirrormind/avatars/avatar_student_prajwal_seed.jpg';
  String? _resumeUrl;
  String? _resumeFilename;

  List<String> _skills = [];
  List<ProjectItem> _projects = [];
  List<InternshipItem> _internships = [];

  bool _isSubmitting = false;
  String _submitStep = '';
  String? _errorMessage;

  final List<String> _commonSkills = [
    'Python',
    'PyTorch',
    'React',
    'Next.js',
    'FastAPI',
    'MongoDB',
    'Docker',
    'SQL',
    'TypeScript',
    'Node.js',
    'AWS',
    'TensorFlow',
    'Git',
  ];

  final List<Map<String, String>> _roleOptions = [
    {'value': 'AIML_ENGINEER', 'label': 'AI / ML Engineer'},
    {'value': 'SWE_BACKEND', 'label': 'Backend Developer'},
    {'value': 'FULLSTACK_DEV', 'label': 'Fullstack Developer'},
    {'value': 'DATA_ENGINEER', 'label': 'Data Engineer'},
    {'value': 'DEVOPS_CLOUD', 'label': 'DevOps & Cloud Engineer'},
    {'value': 'DATA_ANALYST', 'label': 'Data Analyst'},
    {'value': 'CYBERSECURITY', 'label': 'Cybersecurity Analyst'},
    {'value': 'EMBEDDED_IOT', 'label': 'Embedded Systems & IoT'},
    {'value': 'SWE_FRONTEND', 'label': 'Frontend Developer'},
    {'value': 'PRODUCT_MANAGER', 'label': 'Technical Product Manager'},
  ];

  @override
  void initState() {
    super.initState();
    final p = widget.initialProfile;
    _nameController = TextEditingController(text: p?.name ?? widget.userName);
    _phoneController = TextEditingController(text: p?.phone ?? '');
    _collegeController = TextEditingController(text: p?.collegeName ?? 'Visvesvaraya Technological University');
    _branchController = TextEditingController(text: p?.branch ?? 'Computer Science & Engineering');
    _githubController = TextEditingController(text: p?.githubUrl ?? '');
    _linkedinController = TextEditingController(text: p?.linkedinUrl ?? '');
    _skillInputController = TextEditingController();

    if (p != null) {
      _collegeTier = p.collegeTier;
      _semester = p.semester;
      _cgpa = p.cgpa;
      _backlogCount = p.backlogCount;
      _careerInterest = p.careerInterest;
      _communicationRating = p.communicationRating;
      _workStyle = p.workStylePref;
      _avatarUrl = p.avatarUrl ?? _avatarUrl;
      _resumeUrl = p.resumeUrl;
      _resumeFilename = p.resumeFilename;
      _skills = List.from(p.skills);
      _projects = List.from(p.projects);
      _internships = List.from(p.internships);
    } else {
      _skills = ['Python', 'FastAPI', 'PyTorch', 'React', 'MongoDB'];
      _projects = [
        ProjectItem(
          title: 'MirrorMind Career AI Platform',
          description: 'Deep neural network and dense embedding pipeline for career guidance.',
          techStack: ['Python', 'FastAPI', 'PyTorch', 'MongoDB'],
          githubUrl: 'https://github.com/PrajwalGaniga/MirrorMind-v2',
        ),
      ];
      _internships = [
        InternshipItem(
          companyName: 'ZenLog Tech',
          role: 'AI Engineering Intern',
          domain: 'AI / ML',
          description: 'Engineered PyTorch neural models and deployed microservices.',
        ),
      ];
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _collegeController.dispose();
    _branchController.dispose();
    _githubController.dispose();
    _linkedinController.dispose();
    _skillInputController.dispose();
    super.dispose();
  }

  void _handleResumeExtracted(ExtractedResumeData data, String url, String filename) {
    setState(() {
      if (data.name != null && data.name!.isNotEmpty) _nameController.text = data.name!;
      if (data.phone != null && data.phone!.isNotEmpty) _phoneController.text = data.phone!;
      if (data.college != null && data.college!.isNotEmpty) _collegeController.text = data.college!;
      if (data.branch != null && data.branch!.isNotEmpty) _branchController.text = data.branch!;
      if (data.cgpa != null) _cgpa = data.cgpa!;
      if (data.githubUrl != null) _githubController.text = data.githubUrl!;
      if (data.linkedinUrl != null) _linkedinController.text = data.linkedinUrl!;

      _resumeUrl = url;
      _resumeFilename = filename;

      // Merge skills
      for (final s in data.skills) {
        if (!_skills.any((existing) => existing.toLowerCase() == s.toLowerCase())) {
          _skills.add(s);
        }
      }

      // Merge projects
      if (data.projects.isNotEmpty) {
        _projects = data.projects.map((p) {
          return ProjectItem(
            title: p['title'] ?? 'Project',
            description: p['description'] ?? 'Extracted from resume',
            techStack: (p['tech_stack'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
          );
        }).toList();
      }

      // Merge internships
      if (data.internships.isNotEmpty) {
        _internships = data.internships.map((i) {
          return InternshipItem(
            companyName: i['company_name'] ?? 'Company',
            role: i['role'] ?? 'Intern',
            domain: i['domain'],
          );
        }).toList();
      }
    });
  }

  void _addSkill(String s) {
    final clean = s.trim();
    if (clean.isEmpty) return;
    if (!_skills.any((existing) => existing.toLowerCase() == clean.toLowerCase())) {
      setState(() {
        _skills.add(clean);
      });
    }
    _skillInputController.clear();
  }

  Future<void> _submitProfile() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _errorMessage = 'Please enter your full name');
      return;
    }
    if (_skills.isEmpty) {
      setState(() => _errorMessage = 'Please add at least one technical skill');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _submitStep = 'Saving student profile to MongoDB Atlas...';
      _errorMessage = null;
    });

    try {
      final profile = StudentProfile(
        name: name,
        email: widget.userEmail.trim().toLowerCase(),
        phone: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
        avatarUrl: _avatarUrl,
        githubUrl: _githubController.text.trim().isNotEmpty ? _githubController.text.trim() : null,
        linkedinUrl: _linkedinController.text.trim().isNotEmpty ? _linkedinController.text.trim() : null,
        collegeName: _collegeController.text.trim().isNotEmpty ? _collegeController.text.trim() : null,
        collegeTier: _collegeTier,
        branch: _branchController.text.trim(),
        semester: _semester,
        cgpa: _cgpa,
        backlogCount: _backlogCount,
        careerInterest: _careerInterest,
        communicationRating: _communicationRating,
        workStylePref: _workStyle,
        skills: _skills,
        projects: _projects.where((p) => p.title.trim().isNotEmpty).toList(),
        internships: _internships.where((i) => i.companyName.trim().isNotEmpty).toList(),
        resumeUrl: _resumeUrl,
        resumeFilename: _resumeFilename,
      );

      final saved = await ApiService().saveStudentProfile(profile);

      if (mounted) {
        setState(() {
          _submitStep = 'Executing SentenceTransformers & PyTorch CareerMLP...';
        });
      }

      final prediction = await ApiService().predictCareer(
        email: saved.email,
        skills: saved.skills,
        cgpa: saved.cgpa,
        projectsCount: saved.projects.length,
        internshipsCount: saved.internships.length,
      );

      if (mounted) {
        setState(() => _isSubmitting = false);
        widget.onSuccess(saved, prediction);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Career Profile', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: widget.onCancel != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: widget.onCancel,
              )
            : null,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Fast-Track Resume Dropzone
              ResumeUploadCard(onExtracted: _handleResumeExtracted),
              const SizedBox(height: 20),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.accentRed.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.accentRed.withOpacity(0.3)),
                  ),
                  child: Text(
                    '⚠️ $_errorMessage',
                    style: const TextStyle(fontSize: 12, color: Color(0xFFFCA5A5)),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // 1. Identity & Online Presence
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionTitle('STEP 1: IDENTITY & CONTACT'),
                    const SizedBox(height: 14),

                    // Avatar Preview & Luffy Chip
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: AppTheme.accentCyan.withOpacity(0.2),
                          backgroundImage: NetworkImage(_avatarUrl),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Profile Avatar', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                              const SizedBox(height: 4),
                              Text(
                                'Hosted on Cloudinary CDN',
                                style: TextStyle(fontSize: 11, color: AppTheme.textSubtle.withOpacity(0.9)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(labelText: 'Full Name *'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      initialValue: widget.userEmail,
                      enabled: false,
                      decoration: const InputDecoration(labelText: 'Email Address (Synced)'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Phone Number'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _githubController,
                      decoration: const InputDecoration(labelText: 'GitHub Profile URL'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _linkedinController,
                      decoration: const InputDecoration(labelText: 'LinkedIn Profile URL'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 2. Academic Background
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionTitle('STEP 2: ACADEMIC CREDENTIALS'),
                    const SizedBox(height: 14),

                    TextField(
                      controller: _collegeController,
                      decoration: const InputDecoration(labelText: 'College / University'),
                    ),
                    const SizedBox(height: 12),

                    DropdownButtonFormField<String>(
                      value: _collegeTier,
                      decoration: const InputDecoration(labelText: 'College Tier'),
                      items: const [
                        DropdownMenuItem(value: 'Tier-1', child: Text('Tier-1 (IITs, NITs, BITS)')),
                        DropdownMenuItem(value: 'Tier-2', child: Text('Tier-2 (Top State/Private)')),
                        DropdownMenuItem(value: 'Tier-3', child: Text('Tier-3 (Affiliated Regional)')),
                      ],
                      onChanged: (v) => setState(() => _collegeTier = v ?? 'Tier-2'),
                    ),
                    const SizedBox(height: 12),

                    TextField(
                      controller: _branchController,
                      decoration: const InputDecoration(labelText: 'Branch / Engineering Discipline'),
                    ),
                    const SizedBox(height: 16),

                    // Semester Selector
                    Text('Current Semester: Sem $_semester', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      children: List.generate(8, (i) {
                        final sem = i + 1;
                        final isSel = _semester == sem;
                        return ChoiceChip(
                          label: Text('Sem $sem', style: TextStyle(fontSize: 11, color: isSel ? Colors.white : AppTheme.textMuted)),
                          selected: isSel,
                          selectedColor: AppTheme.accentIndigo.withOpacity(0.4),
                          backgroundColor: Colors.white.withOpacity(0.04),
                          onSelected: (_) => setState(() => _semester = sem),
                        );
                      }),
                    ),
                    const SizedBox(height: 16),

                    // CGPA Slider
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Cumulative GPA (CGPA):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        Text(
                          _cgpa.toStringAsFixed(1),
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.accentCyan),
                        ),
                      ],
                    ),
                    Slider(
                      value: _cgpa,
                      min: 5.0,
                      max: 10.0,
                      divisions: 50,
                      activeColor: AppTheme.accentCyan,
                      onChanged: (v) => setState(() => _cgpa = v),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 3. Career Aspirations
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionTitle('STEP 3: CAREER PREFERENCES'),
                    const SizedBox(height: 14),

                    DropdownButtonFormField<String>(
                      value: _careerInterest,
                      decoration: const InputDecoration(labelText: 'Target Career Role'),
                      items: _roleOptions.map((r) {
                        return DropdownMenuItem(value: r['value'], child: Text(r['label']!));
                      }).toList(),
                      onChanged: (v) => setState(() => _careerInterest = v ?? 'AIML_ENGINEER'),
                    ),
                    const SizedBox(height: 14),

                    // Communication Rating
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Communication Self-Rating:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        Row(
                          children: List.generate(5, (i) {
                            final star = i + 1;
                            return GestureDetector(
                              onTap: () => setState(() => _communicationRating = star),
                              child: Icon(
                                Icons.star,
                                size: 20,
                                color: _communicationRating >= star ? AppTheme.accentAmber : Colors.white.withOpacity(0.15),
                              ),
                            );
                          }),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    DropdownButtonFormField<String>(
                      value: _workStyle,
                      decoration: const InputDecoration(labelText: 'Work Style Preference'),
                      items: const [
                        DropdownMenuItem(value: 'hybrid', child: Text('🏢 Hybrid (Office + Remote)')),
                        DropdownMenuItem(value: 'remote', child: Text('🏠 Fully Remote')),
                        DropdownMenuItem(value: 'startup', child: Text('🚀 Fast-Paced Startup')),
                        DropdownMenuItem(value: 'enterprise', child: Text('🏛️ Enterprise MNC')),
                      ],
                      onChanged: (v) => setState(() => _workStyle = v ?? 'hybrid'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 4. Skills Cloud
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionTitle('STEP 4: TECHNICAL SKILLS (${_skills.length})'),
                    const SizedBox(height: 8),
                    Text(
                      'Feeds the 384-D dense embedding vector space',
                      style: TextStyle(fontSize: 11.5, color: AppTheme.textSubtle.withOpacity(0.9)),
                    ),
                    const SizedBox(height: 12),

                    // Active Skill Chips
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _skills.map((s) {
                        return Chip(
                          label: Text(s, style: const TextStyle(fontSize: 11.5, color: Color(0xFFA5F3FC))),
                          backgroundColor: AppTheme.accentCyan.withOpacity(0.12),
                          side: BorderSide(color: AppTheme.accentCyan.withOpacity(0.3)),
                          deleteIcon: const Icon(Icons.close, size: 14, color: AppTheme.accentCyan),
                          onDeleted: () => setState(() => _skills.remove(s)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),

                    // Add Custom Skill
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _skillInputController,
                            decoration: const InputDecoration(
                              hintText: 'Type a skill (e.g. PyTorch, Docker)...',
                            ),
                            onSubmitted: _addSkill,
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.add_circle, color: AppTheme.accentCyan, size: 32),
                          onPressed: () => _addSkill(_skillInputController.text),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Suggested chips
                    Text(
                      'Quick Add Suggestions:',
                      style: TextStyle(fontSize: 11, color: AppTheme.textSubtle.withOpacity(0.85)),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _commonSkills
                          .where((s) => !_skills.any((sk) => sk.toLowerCase() == s.toLowerCase()))
                          .map((s) {
                        return ActionChip(
                          label: Text('+ $s', style: const TextStyle(fontSize: 11)),
                          backgroundColor: Colors.white.withOpacity(0.04),
                          onPressed: () => _addSkill(s),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 5. Projects
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _sectionTitle('STEP 5: PROJECTS (${_projects.length})'),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _projects.add(ProjectItem(title: '', description: ''));
                            });
                          },
                          child: const Text('+ Add Project', style: TextStyle(fontSize: 12, color: AppTheme.accentCyan)),
                        ),
                      ],
                    ),
                    ..._projects.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final proj = entry.value;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.03),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white.withOpacity(0.06)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Project #${idx + 1}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                                IconButton(
                                  icon: const Icon(Icons.delete, color: AppTheme.accentRed, size: 18),
                                  onPressed: () => setState(() => _projects.removeAt(idx)),
                                ),
                              ],
                            ),
                            TextField(
                              controller: TextEditingController(text: proj.title),
                              decoration: const InputDecoration(labelText: 'Title'),
                              onChanged: (v) {
                                _projects[idx] = ProjectItem(
                                  title: v,
                                  description: proj.description,
                                  techStack: proj.techStack,
                                  githubUrl: proj.githubUrl,
                                );
                              },
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: TextEditingController(text: proj.description),
                              decoration: const InputDecoration(labelText: 'Description'),
                              onChanged: (v) {
                                _projects[idx] = ProjectItem(
                                  title: proj.title,
                                  description: v,
                                  techStack: proj.techStack,
                                  githubUrl: proj.githubUrl,
                                );
                              },
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Submit Button
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitProfile,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: AppTheme.accentCyan,
                ),
                child: _isSubmitting
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.bgDark),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            _submitStep,
                            style: const TextStyle(color: AppTheme.bgDark, fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                        ],
                      )
                    : const Text(
                        '🚀 Save Profile & Run Career AI',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                      ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppTheme.accentIndigo.withOpacity(0.2),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppTheme.accentCyan,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
