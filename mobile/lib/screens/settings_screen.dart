import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _urlController = TextEditingController();
  bool _testing = false;
  Map<String, dynamic>? _healthResult;

  @override
  void initState() {
    super.initState();
    _loadUrl();
  }

  Future<void> _loadUrl() async {
    final current = await ApiService().getBaseUrl();
    setState(() => _urlController.text = current);
    _testConnection();
  }

  Future<void> _testConnection() async {
    setState(() {
      _testing = true;
      _healthResult = null;
    });

    final res = await ApiService().checkHealth();

    if (mounted) {
      setState(() {
        _testing = false;
        _healthResult = res;
      });
    }
  }

  Future<void> _saveUrl() async {
    await ApiService().setBaseUrl(_urlController.text);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Backend URL updated successfully!'),
          backgroundColor: AppTheme.accentEmerald,
        ),
      );
      _testConnection();
    }
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.shellBase,
      appBar: AppBar(
        title: const Text('Backend & Infrastructure Settings', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.textPrimary)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('FastAPI Server Base URL', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: AppTheme.textPrimary)),
                    const SizedBox(height: 6),
                    const Text(
                      '• Production Backend: https://mirrormind-backend-z9vb.onrender.com\n• Android Emulator (Local): http://10.0.2.2:8000\n• Windows / Web (Local): http://localhost:8000',
                      style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, height: 1.45),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _urlController,
                      decoration: const InputDecoration(
                        labelText: 'API Base URL',
                        prefixIcon: Icon(Icons.link, size: 18),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _saveUrl,
                            child: const Text('Save & Apply URL'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton(
                          onPressed: _testing ? null : _testConnection,
                          child: _testing
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.charcoal))
                              : const Text('Test Ping'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Health Status Card
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Service Health Status', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: AppTheme.textPrimary)),
                    const SizedBox(height: 12),
                    if (_healthResult != null) ...[
                      _healthRow(
                        'FastAPI Server',
                        _healthResult!['status'] == 'healthy',
                        _healthResult!['app_name'] ?? 'FastAPI',
                      ),
                      const SizedBox(height: 10),
                      _healthRow(
                        'MongoDB Atlas',
                        _healthResult!['services']?['database']?['status'] == 'connected',
                        _healthResult!['services']?['database']?['database'] ?? 'mirrormind_db',
                      ),
                      const SizedBox(height: 10),
                      _healthRow(
                        'PyTorch CareerMLP',
                        _healthResult!['services']?['ml_engine']?['loaded'] == true,
                        _healthResult!['services']?['ml_engine']?['embedding_model'] ?? 'MiniLM-L6-v2',
                      ),
                      const SizedBox(height: 10),
                      _healthRow(
                        'Gemini 3.8 Flash AI',
                        _healthResult!['services']?['gemini_ai']?['configured'] == true,
                        _healthResult!['services']?['gemini_ai']?['model'] ?? 'gemini-3.8-flash',
                      ),
                      const SizedBox(height: 10),
                      _healthRow(
                        'Cloudinary CDN',
                        _healthResult!['services']?['cloudinary']?['configured'] == true,
                        _healthResult!['services']?['cloudinary']?['cloud_name'] ?? 'llinkz0a',
                      ),
                    ] else ...[
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Text('Testing server connection...', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _healthRow(String title, bool isHealthy, String subtitle) {
    final color = isHealthy ? AppTheme.accentEmerald : AppTheme.accentRed;
    final bgColor = isHealthy ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2);

    return Row(
      children: [
        Icon(isHealthy ? Icons.check_circle : Icons.cancel, color: color, size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: AppTheme.textPrimary)),
              Text(subtitle, style: const TextStyle(fontSize: 10.5, color: AppTheme.textSecondary)),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: color.withAlpha(50)),
          ),
          child: Text(
            isHealthy ? 'ACTIVE' : 'OFFLINE',
            style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: color),
          ),
        ),
      ],
    );
  }
}
