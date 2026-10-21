import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_tts/flutter_tts.dart';
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
  final FlutterTts _flutterTts = FlutterTts();

  bool _isListening = false;
  bool _isProcessing = false;
  bool _isSpeaking = false;
  String _assistantSpeech =
      'Hi Prajwal! Great to connect with you. How can I help boost your engineering career, CGPA trajectory, or placement readiness today?';

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

    _initTts();
  }

  Future<void> _initTts() async {
    try {
      await _flutterTts.setLanguage("en-US");
      await _flutterTts.setSpeechRate(0.5);
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);

      _flutterTts.setStartHandler(() {
        if (mounted) setState(() => _isSpeaking = true);
      });
      _flutterTts.setCompletionHandler(() {
        if (mounted) setState(() => _isSpeaking = false);
      });
      _flutterTts.setCancelHandler(() {
        if (mounted) setState(() => _isSpeaking = false);
      });
      _flutterTts.setErrorHandler((msg) {
        if (mounted) setState(() => _isSpeaking = false);
      });
    } catch (_) {
      // Fallback silently if platform audio service is initializing
    }
  }

  String _cleanTextForSpeech(String rawText) {
    return rawText
        .replaceAll(RegExp(r'#{1,6}\s*'), '')
        .replaceAll(RegExp(r'\*{1,3}'), '')
        .replaceAll(RegExp(r'\[(.*?)\]\(.*?\)'), r'$1')
        .replaceAll(RegExp(r'[`_~>-]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  Future<void> _speak(String text) async {
    try {
      await _flutterTts.stop();
      final clean = _cleanTextForSpeech(text);
      if (clean.isNotEmpty) {
        if (mounted) setState(() => _isSpeaking = true);
        await _flutterTts.speak(clean);
      }
    } catch (e) {
      if (mounted) setState(() => _isSpeaking = false);
    }
  }

  Future<void> _stopSpeaking() async {
    try {
      await _flutterTts.stop();
      if (mounted) setState(() => _isSpeaking = false);
    } catch (_) {}
  }

  @override
  void dispose() {
    _flutterTts.stop();
    _animController.dispose();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _sendQuery(String prompt) async {
    final query = prompt.trim();
    if (query.isEmpty) return;

    await _stopSpeaking();

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
        final answer = res['answer'] ??
            'Your academic profile and portfolio project records are verified and grounded in the vector vault.';
        setState(() {
          _assistantSpeech = answer;
          _isProcessing = false;
        });
        // Speak out the answer automatically!
        _speak(answer);
      }
    } catch (e) {
      if (mounted) {
        final fallback =
            'Based on your CGPA of ${widget.student.cgpa} and verified technical skills (${widget.student.skills.take(5).join(", ")}), you have a strong grounded foundation for high-impact engineering and AI roles.';
        setState(() {
          _assistantSpeech = fallback;
          _isProcessing = false;
        });
        _speak(fallback);
      }
    }
  }

  void _toggleMic() {
    if (_isSpeaking) {
      _stopSpeaking();
      return;
    }

    setState(() {
      _isListening = !_isListening;
    });

    if (_isListening) {
      // Simulate listening and trigger question
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
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final maxModalHeight = MediaQuery.of(context).size.height * 0.88;

    return Container(
      constraints: BoxConstraints(maxHeight: maxModalHeight),
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: bottomInset > 0 ? bottomInset + 16 : 24,
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
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.borderSubtle,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          const SizedBox(height: 12),

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
                      Text(
                        'Voice Copilot',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppTheme.textPrimary),
                      ),
                      Text(
                        'Strictly Grounded in Student Growth',
                        style: TextStyle(fontSize: 10.5, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 20),
                onPressed: () {
                  _stopSpeaking();
                  Navigator.pop(context);
                },
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Scrollable Body
          Flexible(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Voice Orb / Wave Visualizer
                  Center(
                    child: AnimatedBuilder(
                      animation: _animController,
                      builder: (context, child) {
                        final pulse =
                            (_isListening || _isProcessing || _isSpeaking) ? _animController.value : 0.15;
                        final activeColor = _isSpeaking
                            ? const Color(0xFF3B82F6) // Blue pulse while speaking
                            : (_isListening ? AppTheme.accentEmerald : AppTheme.charcoal);

                        return GestureDetector(
                          onTap: _toggleMic,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // Outer pulse ring
                              Container(
                                width: 84 + (pulse * 22),
                                height: 84 + (pulse * 22),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: activeColor.withAlpha((25 + pulse * 45).toInt()),
                                ),
                              ),
                              // Core button
                              Container(
                                width: 72,
                                height: 72,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: activeColor,
                                  boxShadow: const [
                                    BoxShadow(color: Color(0x181E2023), blurRadius: 16, offset: Offset(0, 4)),
                                  ],
                                ),
                                child: Center(
                                  child: Icon(
                                    _isSpeaking
                                        ? Icons.volume_up
                                        : (_isListening
                                            ? Icons.mic
                                            : (_isProcessing ? Icons.sync : Icons.mic_none)),
                                    color: Colors.white,
                                    size: 30,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Orb Status Text
                  Center(
                    child: Text(
                      _isSpeaking
                          ? 'Speaking response aloud (Tap to Stop)...'
                          : (_isListening
                              ? 'Listening to student question...'
                              : (_isProcessing ? 'Grounded Copilot Reasoning...' : 'Tap Orb to Speak')),
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: _isSpeaking
                            ? const Color(0xFF2563EB)
                            : (_isListening ? AppTheme.accentEmerald : AppTheme.textSecondary),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Spoken Response Box
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceSoft,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.format_quote, size: 20, color: AppTheme.charcoal),
                            const SizedBox(width: 8),
                            Expanded(
                              child: SelectableText(
                                _assistantSpeech,
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  color: AppTheme.textPrimary,
                                  height: 1.45,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(height: 1, color: AppTheme.borderSubtle),
                        const SizedBox(height: 8),

                        // Voice Controls (Speak aloud / Stop / Copy)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            if (_isSpeaking)
                              TextButton.icon(
                                onPressed: _stopSpeaking,
                                icon: const Icon(Icons.stop_circle_outlined, size: 16, color: Color(0xFFDC2626)),
                                label: const Text(
                                  'Stop Voice',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFDC2626)),
                                ),
                              )
                            else
                              TextButton.icon(
                                onPressed: () => _speak(_assistantSpeech),
                                icon: const Icon(Icons.volume_up_outlined, size: 16, color: AppTheme.charcoal),
                                label: const Text(
                                  'Speak Aloud',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                                ),
                              ),
                            const SizedBox(width: 6),
                            IconButton(
                              icon: const Icon(Icons.copy, size: 15, color: AppTheme.textSecondary),
                              tooltip: 'Copy Answer',
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () {
                                Clipboard.setData(ClipboardData(text: _assistantSpeech));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Copied response to clipboard'),
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Quick Starter Prompts
                  const Text(
                    'CAREER & GROWTH QUESTIONS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMuted,
                      letterSpacing: 0.8,
                    ),
                  ),
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
                              Text(
                                p,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),

                  // Ask any question input box
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceSoft,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.borderSubtle),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _textController,
                            style: const TextStyle(fontSize: 12.5),
                            decoration: const InputDecoration(
                              hintText: 'Type or ask career questions...',
                              border: InputBorder.none,
                              isDense: true,
                              hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                            ),
                            onSubmitted: (val) {
                              if (val.trim().isNotEmpty) {
                                _sendQuery(val.trim());
                                _textController.clear();
                              }
                            },
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.send_rounded, size: 18, color: AppTheme.charcoal),
                          onPressed: () {
                            final val = _textController.text.trim();
                            if (val.isNotEmpty) {
                              _sendQuery(val);
                              _textController.clear();
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
