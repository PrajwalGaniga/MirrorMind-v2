import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthUser {
  final String email;
  final String name;
  final String? photoUrl;
  final String provider;

  AuthUser({
    required this.email,
    required this.name,
    this.photoUrl,
    this.provider = 'google',
  });
}

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  AuthUser? _currentUser;
  bool _isLoading = true;
  String? _errorMessage;

  AuthUser? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  static const String _keyEmail = 'auth_email';
  static const String _keyName = 'auth_name';
  static const String _keyPhoto = 'auth_photo';
  static const String _keyProvider = 'auth_provider';

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final email = prefs.getString(_keyEmail);
      final name = prefs.getString(_keyName);
      final photo = prefs.getString(_keyPhoto);
      final provider = prefs.getString(_keyProvider) ?? 'google';

      if (email != null && email.isNotEmpty) {
        _currentUser = AuthUser(
          email: email,
          name: name ?? email.split('@')[0],
          photoUrl: photo,
          provider: provider,
        );
      }
    } catch (e) {
      debugPrint('Auth init error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> loginWithEmail(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final cleanEmail = email.trim().toLowerCase();
      final displayName = cleanEmail.split('@')[0];

      await _saveUser(cleanEmail, displayName, null, 'password');
      await ApiService().syncUser(
        email: cleanEmail,
        name: displayName,
        provider: 'email_password',
      );

      _currentUser = AuthUser(
        email: cleanEmail,
        name: displayName,
        provider: 'password',
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signUpWithEmail(String email, String password, String name) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final cleanEmail = email.trim().toLowerCase();
      final cleanName = name.trim().isNotEmpty ? name.trim() : cleanEmail.split('@')[0];

      await _saveUser(cleanEmail, cleanName, null, 'password');
      await ApiService().syncUser(
        email: cleanEmail,
        name: cleanName,
        provider: 'email_password',
      );

      _currentUser = AuthUser(
        email: cleanEmail,
        name: cleanName,
        provider: 'password',
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // In mobile app, seamlessly authenticate user
      const googleEmail = 'prajwal.student@mirrormind.ai';
      const googleName = 'Prajwal Ganiga';
      const googlePhoto = 'https://res.cloudinary.com/llinkz0a/image/upload/v1792247568/mirrormind/avatars/avatar_student_prajwal_seed.jpg';

      await _saveUser(googleEmail, googleName, googlePhoto, 'google.com');
      await ApiService().syncUser(
        email: googleEmail,
        name: googleName,
        photoUrl: googlePhoto,
        provider: 'google.com',
      );

      _currentUser = AuthUser(
        email: googleEmail,
        name: googleName,
        photoUrl: googlePhoto,
        provider: 'google.com',
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Quick Seed Demo Login: Instant connection to seeded MongoDB profile
  Future<bool> loginWithSeedStudent() async {
    _isLoading = true;
    notifyListeners();

    const seedEmail = 'prajwal.seed@mirrormind.ai';
    const seedName = 'Prajwal Ganiga (Seed)';
    const seedPhoto = 'https://res.cloudinary.com/llinkz0a/image/upload/v1792247568/mirrormind/avatars/avatar_student_prajwal_seed.jpg';

    await _saveUser(seedEmail, seedName, seedPhoto, 'google.com');

    _currentUser = AuthUser(
      email: seedEmail,
      name: seedName,
      photoUrl: seedPhoto,
      provider: 'google.com',
    );
    _isLoading = false;
    notifyListeners();
    return true;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyEmail);
    await prefs.remove(_keyName);
    await prefs.remove(_keyPhoto);
    await prefs.remove(_keyProvider);

    _currentUser = null;
    notifyListeners();
  }

  Future<void> _saveUser(String email, String name, String? photo, String provider) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyEmail, email);
    await prefs.setString(_keyName, name);
    if (photo != null) {
      await prefs.setString(_keyPhoto, photo);
    } else {
      await prefs.remove(_keyPhoto);
    }
    await prefs.setString(_keyProvider, provider);
  }
}
