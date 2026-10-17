import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'settings_screen.dart';

class AuthScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const AuthScreen({super.key, required this.onLoginSuccess});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isSignUp = false;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _handleEmailAuth() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please fill in all fields');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    bool ok;
    if (_isSignUp) {
      final name = _nameController.text.trim();
      ok = await AuthService().signUpWithEmail(email, password, name);
    } else {
      ok = await AuthService().loginWithEmail(email, password);
    }

    if (mounted) {
      setState(() => _loading = false);
      if (ok) {
        widget.onLoginSuccess();
      } else {
        setState(() => _error = AuthService().errorMessage ?? 'Authentication failed');
      }
    }
  }

  Future<void> _handleGoogleLogin() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final ok = await AuthService().loginWithGoogle();
    if (mounted) {
      setState(() => _loading = false);
      if (ok) {
        widget.onLoginSuccess();
      } else {
        setState(() => _error = 'Google login failed');
      }
    }
  }

  Future<void> _handleSeedLogin() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final ok = await AuthService().loginWithSeedStudent();
    if (mounted) {
      setState(() => _loading = false);
      if (ok) {
        widget.onLoginSuccess();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: AppTheme.textMuted),
            tooltip: 'Server Settings',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Brand Icon & Title
                Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    gradient: AppTheme.glowGradient,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x666366F1),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'M',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'MirrorMind v2',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  'Neural Career Intelligence & Skill Radar',
                  style: TextStyle(fontSize: 12.5, color: AppTheme.textMuted.withOpacity(0.9)),
                ),
                const SizedBox(height: 28),

                // Main Auth Card
                GlassCard(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Google 1-Click Button
                      ElevatedButton(
                        onPressed: _loading ? null : _handleGoogleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.08),
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: AppTheme.borderColor),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Image.network(
                              'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                              width: 18,
                              height: 18,
                              errorBuilder: (_, __, ___) => const Icon(Icons.account_circle, size: 18),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Continue with Google',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Seed Student Instant Test Button
                      OutlinedButton.icon(
                        onPressed: _loading ? null : _handleSeedLogin,
                        icon: const Text('⚡', style: TextStyle(fontSize: 16)),
                        label: const Text(
                          'Test Demo: Seeded Student (Luffy)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.accentCyan),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: AppTheme.accentCyan.withOpacity(0.4)),
                          backgroundColor: AppTheme.accentCyan.withOpacity(0.06),
                          padding: const EdgeInsets.symmetric(vertical: 11),
                        ),
                      ),

                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(child: Divider(color: Colors.white.withOpacity(0.1))),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            child: Text(
                              'or use email',
                              style: TextStyle(fontSize: 11, color: AppTheme.textSubtle.withOpacity(0.9)),
                            ),
                          ),
                          Expanded(child: Divider(color: Colors.white.withOpacity(0.1))),
                        ],
                      ),
                      const SizedBox(height: 18),

                      if (_error != null) ...[
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.accentRed.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.accentRed.withOpacity(0.3)),
                          ),
                          child: Text(
                            _error!,
                            style: const TextStyle(fontSize: 12, color: Color(0xFFFCA5A5)),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      if (_isSignUp) ...[
                        TextField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            labelText: 'Full Name',
                            prefixIcon: Icon(Icons.person, size: 18, color: AppTheme.textSubtle),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],

                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email Address',
                          prefixIcon: Icon(Icons.email, size: 18, color: AppTheme.textSubtle),
                        ),
                      ),
                      const SizedBox(height: 12),

                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          prefixIcon: Icon(Icons.lock, size: 18, color: AppTheme.textSubtle),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Submit Button
                      ElevatedButton(
                        onPressed: _loading ? null : _handleEmailAuth,
                        child: _loading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.bgDark),
                            )
                          : Text(_isSignUp ? 'Create Free Account' : 'Sign In'),
                      ),

                      const SizedBox(height: 14),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _isSignUp = !_isSignUp;
                            _error = null;
                          });
                        },
                        child: Text(
                          _isSignUp
                              ? 'Already have an account? Sign In'
                              : "Don't have an account? Sign Up",
                          style: const TextStyle(fontSize: 12, color: AppTheme.accentCyan),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
