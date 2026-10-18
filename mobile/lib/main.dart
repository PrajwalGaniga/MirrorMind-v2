import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'models/student_profile.dart';
import 'models/prediction.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'theme/app_theme.dart';
import 'screens/auth_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  await AuthService().init();

  runApp(const MirrorMindApp());
}

class MirrorMindApp extends StatelessWidget {
  const MirrorMindApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MirrorMind v2',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const AppRootController(),
    );
  }
}

class AppRootController extends StatefulWidget {
  const AppRootController({super.key});

  @override
  State<AppRootController> createState() => _AppRootControllerState();
}

class _AppRootControllerState extends State<AppRootController> {
  final AuthService _auth = AuthService();
  StudentProfile? _studentProfile;
  PredictResponse? _prediction;
  bool _checkingProfile = false;

  @override
  void initState() {
    super.initState();
    _auth.addListener(_onAuthChanged);
    _checkStudentProfile();
  }

  @override
  void dispose() {
    _auth.removeListener(_onAuthChanged);
    super.dispose();
  }

  void _onAuthChanged() {
    setState(() {});
    _checkStudentProfile();
  }

  Future<void> _checkStudentProfile() async {
    if (!_auth.isAuthenticated) {
      setState(() {
        _studentProfile = null;
        _prediction = null;
        _checkingProfile = false;
      });
      return;
    }

    setState(() => _checkingProfile = true);

    try {
      final email = _auth.currentUser!.email;
      final profile = await ApiService().getStudentProfile(email);

      if (mounted) {
        setState(() {
          _studentProfile = profile;
          _checkingProfile = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _checkingProfile = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_auth.isLoading || _checkingProfile) {
      return Scaffold(
        backgroundColor: AppTheme.shellBase,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: AppTheme.charcoal,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(color: Color(0x121E2023), blurRadius: 18, offset: Offset(0, 6)),
                  ],
                ),
                child: const Center(
                  child: Text('M', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.accent, fontSize: 28)),
                ),
              ),
              const SizedBox(height: 22),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.charcoal),
              ),
              const SizedBox(height: 14),
              const Text(
                'MirrorMind v2',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 4),
              const Text(
                'Connecting to Grounded Neural Engine...',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    if (!_auth.isAuthenticated) {
      return AuthScreen(onLoginSuccess: _checkStudentProfile);
    }

    if (_studentProfile == null) {
      return OnboardingScreen(
        userEmail: _auth.currentUser!.email,
        userName: _auth.currentUser!.name,
        userPhoto: _auth.currentUser!.photoUrl,
        onSuccess: (savedProfile, prediction) {
          setState(() {
            _studentProfile = savedProfile;
            _prediction = prediction;
          });
        },
      );
    }

    return DashboardScreen(
      student: _studentProfile!,
      prediction: _prediction,
      onProfileUpdated: _checkStudentProfile,
    );
  }
}
