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
      backgroundColor: AppTheme.shellBase,
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppTheme.textSecondary),
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
                    color: AppTheme.charcoal,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(color: Color(0x151E2023), blurRadius: 18, offset: Offset(0, 6)),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'M',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.accent,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'MirrorMind v2',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Autonomous Career Copilot & Live ML Pipeline',
                  style: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 26),

                // Main Auth Card
                GlassCard(
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Google 1-Click Button
                      OutlinedButton(
                        onPressed: _loading ? null : _handleGoogleLogin,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: AppTheme.borderSubtle),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Image.network(
                              'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                              width: 18,
                              height: 18,
                              errorBuilder: (ctx, err, st) => const Icon(Icons.account_circle, size: 18, color: AppTheme.charcoal),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Continue with Google',
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: AppTheme.textPrimary),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Seed Student Instant Test Button
                      ElevatedButton.icon(
                        onPressed: _loading ? null : _handleSeedLogin,
                        icon: const Icon(Icons.bolt, color: AppTheme.charcoal, size: 18),
                        label: const Text(
                          'Test Demo: Seed Student (Prajwal)',
                          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accent,
                          foregroundColor: AppTheme.charcoal,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),

                      const SizedBox(height: 18),
                      const Row(
                        children: [
                          Expanded(child: Divider(color: AppTheme.borderSubtle)),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 10),
                            child: Text(
                              'or use email credentials',
                              style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            ),
                          ),
                          Expanded(child: Divider(color: AppTheme.borderSubtle)),
                        ],
                      ),
                      const SizedBox(height: 16),

                      if (_error != null) ...[
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Text(
                            _error!,
                            style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B)),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      if (_isSignUp) ...[
                        TextField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            labelText: 'Full Name',
                            prefixIcon: Icon(Icons.person_outline, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],

                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email Address',
                          prefixIcon: Icon(Icons.email_outlined, size: 18),
                        ),
                      ),
                      const SizedBox(height: 12),

                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          prefixIcon: Icon(Icons.lock_outline, size: 18),
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Submit Button
                      ElevatedButton(
                        onPressed: _loading ? null : _handleEmailAuth,
                        child: _loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(_isSignUp ? 'Create Student Account' : 'Sign In to MirrorMind'),
                      ),

                      const SizedBox(height: 12),
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
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.charcoal),
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
