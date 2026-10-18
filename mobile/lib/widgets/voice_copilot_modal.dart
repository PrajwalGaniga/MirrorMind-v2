import 'package:flutter/material.dart';
import '../models/student_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class VoiceCopilotModal extends StatefulWidget {
  final StudentProfile student;

  const VoiceCopilotModal({super.key, required this.student});

  @override
  State<VoiceCopilotModal> createState() => _VoiceCopilotModalState();
}

class _VoiceCopilotModalState extends State<VoiceCopilotModal> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  final TextEditingController _textController = TextEditingController();
  bool _isListening = false;
  bool _isProcessing = false;
  String _assistantSpeech = 'Hi Prajwal! Great to connect with you. How can I help boost your engineering career, CGPA trajectory, or placement readiness today?';

  final List<String> _quickPrompts = [
    'Assess my readiness for AI Engineer roles',
    'Review my CGPA & portfolio for placements',
    'What should I build next with PyTorch & FastAPI?',
    'What papers & resume chunks are in my vault?',
  ];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animController.dispose();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _sendQuery(String prompt) async {
    final query = prompt.trim();
    if (query.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _assistantSpeech = 'Consulting student knowledge vault & academic records...';
    });

    try {
      final res = await ApiService().queryKnowledgeVault(
        userId: widget.student.email,
        question: query,
      );

      if (mounted) {
        setState(() {
          _assistantSpeech = res['answer'] ?? 'Your academic profile and portfolio project records are grounded in the vector vault.';
          _isProcessing = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _assistantSpeech = 'Based on your CGPA of ${widget.student.cgpa} and technical skills (${widget.student.skills.take(5).join(", ")}), you have a strong foundation for high-impact engineering roles.';
          _isProcessing = false;
        });
      }
    }
  }

  void _toggleMic() {
    setState(() {
      _isListening = !_isListening;
    });

    if (_isListening) {
      // Simulate listening state
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted && _isListening) {
          setState(() => _isListening = false);
          _sendQuery('Assess my placement readiness for AI/ML roles based on my CGPA and skills');
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.borderSubtle,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppTheme.charcoal,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Icon(Icons.record_voice_over, color: AppTheme.accent, size: 16),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Voice Copilot', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppTheme.textPrimary)),
                      Text('Strictly Grounded in Student Growth', style: TextStyle(fontSize: 10.5, color: AppTheme.textSecondary)),
                    ],
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Voice Orb / Wave Visualizer
          Center(
            child: AnimatedBuilder(
              animation: _animController,
              builder: (context, child) {
                final pulse = _isListening || _isProcessing ? _animController.value : 0.2;
                return GestureDetector(
                  onTap: _toggleMic,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Outer pulse ring
                      Container(
                        width: 90 + (pulse * 24),
                        height: 90 + (pulse * 24),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: (_isListening ? AppTheme.accentEmerald : AppTheme.charcoal).withAlpha((30 + pulse * 40).toInt()),
                        ),
                      ),
                      // Core button
                      Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _isListening ? AppTheme.accentEmerald : AppTheme.charcoal,
                          boxShadow: const [
                            BoxShadow(color: Color(0x181E2023), blurRadius: 16, offset: Offset(0, 4)),
                          ],
                        ),
                        child: Center(
                          child: Icon(
                            _isListening ? Icons.mic : (_isProcessing ? Icons.sync : Icons.mic_none),
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              _isListening ? 'Listening to student question...' : (_isProcessing ? 'Grounded Copilot Reasoning...' : 'Tap Orb to Speak'),
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: _isListening ? AppTheme.accentEmerald : AppTheme.textSecondary,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Spoken Response Box
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surfaceSoft,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.format_quote, size: 20, color: AppTheme.charcoal),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _assistantSpeech,
                    style: const TextStyle(fontSize: 12.5, color: AppTheme.textPrimary, height: 1.45, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Quick Starter Prompts
          const Text('CAREER & GROWTH QUESTIONS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _quickPrompts.map((p) {
              return GestureDetector(
                onTap: () => _sendQuery(p),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: AppTheme.borderSubtle),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.arrow_outward, size: 12, color: AppTheme.charcoal),
                      const SizedBox(width: 4),
                      Text(p, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
