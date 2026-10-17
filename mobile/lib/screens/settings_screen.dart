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
      appBar: AppBar(
        title: const Text('Backend & Infrastructure Settings', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('FastAPI Server Base URL', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    const SizedBox(height: 6),
                    Text(
                      '• Android Emulator: http://10.0.2.2:8000\n• Physical Phone / LAN: http://192.168.31.253:8000\n• Windows / Web: http://localhost:8000',
                      style: TextStyle(fontSize: 11, color: AppTheme.textSubtle.withOpacity(0.9), height: 1.4),
                    ),
                    const SizedBox(height: 12),
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
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Text('Test Connection'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Health Status Card
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Service Health Status', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    const SizedBox(height: 12),
                    if (_healthResult != null) ...[
                      _healthRow(
                        'FastAPI Server',
                        _healthResult!['status'] == 'healthy',
                        _healthResult!['app_name'] ?? 'FastAPI',
                      ),
                      const SizedBox(height: 8),
                      _healthRow(
                        'MongoDB Atlas',
                        _healthResult!['services']?['database']?['status'] == 'connected',
                        _healthResult!['services']?['database']?['database'] ?? 'mirrormind_db',
                      ),
                      const SizedBox(height: 8),
                      _healthRow(
                        'PyTorch CareerMLP',
                        _healthResult!['services']?['ml_engine']?['loaded'] == true,
                        _healthResult!['services']?['ml_engine']?['embedding_model'] ?? 'MiniLM',
                      ),
                      const SizedBox(height: 8),
                      _healthRow(
                        'Gemini 3.8 Flash AI',
                        _healthResult!['services']?['gemini_ai']?['configured'] == true,
                        _healthResult!['services']?['gemini_ai']?['model'] ?? 'gemini-3.8-flash',
                      ),
                      const SizedBox(height: 8),
                      _healthRow(
                        'Cloudinary CDN',
                        _healthResult!['services']?['cloudinary']?['configured'] == true,
                        _healthResult!['services']?['cloudinary']?['cloud_name'] ?? 'llinkz0a',
                      ),
                    ] else ...[
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Text('Testing server connection...', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
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
    return Row(
      children: [
        Icon(isHealthy ? Icons.check_circle : Icons.cancel, color: color, size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
              Text(subtitle, style: TextStyle(fontSize: 10, color: AppTheme.textSubtle.withOpacity(0.9))),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            isHealthy ? 'ACTIVE' : 'OFFLINE',
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: color),
          ),
        ),
      ],
    );
  }
}
