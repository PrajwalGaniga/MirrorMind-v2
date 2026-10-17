import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/student_profile.dart';
import '../models/prediction.dart';
import '../models/resume_parse_result.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  static const String _prefApiUrlKey = 'custom_api_url';

  // Smart default host resolution:
  // Android Emulator uses 10.0.2.2 to access host machine localhost.
  // Windows/Web/iOS uses 127.0.0.1 (localhost).
  String get defaultBaseUrl {
    if (kIsWeb) return 'http://localhost:8000';
    if (Platform.isAndroid) return 'http://10.0.2.2:8000';
    return 'http://127.0.0.1:8000';
  }

  Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_prefApiUrlKey) ?? defaultBaseUrl;
  }

  Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefApiUrlKey, url.trim());
  }

  // 1. Health Check
  Future<Map<String, dynamic>> checkHealth() async {
    final base = await getBaseUrl();
    try {
      final res = await http.get(Uri.parse('$base/api/health')).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('Health check error: $e');
    }
    return {'status': 'offline'};
  }

  // 2. Fetch Student Profile by Email
  Future<StudentProfile?> getStudentProfile(String email) async {
    final base = await getBaseUrl();
    try {
      final url = Uri.parse('$base/api/student/profile/${Uri.encodeComponent(email.trim().toLowerCase())}');
      final res = await http.get(url).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return StudentProfile.fromJson(data);
      } else if (res.statusCode == 404) {
        return null; // Profile does not exist yet
      }
    } catch (e) {
      debugPrint('Fetch profile error: $e');
    }
    return null;
  }

  // 3. Save Student Profile
  Future<StudentProfile> saveStudentProfile(StudentProfile profile) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/student/profile');

    final res = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(profile.toJson()),
    ).timeout(const Duration(seconds: 12));

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      return StudentProfile.fromJson(data);
    } else {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? 'Failed to save student profile');
    }
  }

  // 4. Trigger PyTorch ML Career Prediction
  Future<PredictResponse> predictCareer({
    required String email,
    required List<String> skills,
    double? cgpa,
    int? projectsCount,
    int? internshipsCount,
  }) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/ml/predict');

    final payload = {
      'email': email.trim().toLowerCase(),
      'skills': skills,
      if (cgpa != null) 'cgpa': cgpa,
      if (projectsCount != null) 'projects_count': projectsCount,
      if (internshipsCount != null) 'internships_count': internshipsCount,
    };

    final res = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    ).timeout(const Duration(seconds: 25)); // ML + Gemini insight may take ~4-8s

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      return PredictResponse.fromJson(data);
    } else {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? 'Career prediction inference failed');
    }
  }

  // 5. Upload Resume (.pdf/.docx) to Cloudinary & Extract via Gemini
  Future<ResumeParseResult> uploadResume(List<int> fileBytes, String filename) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/resume/parse');

    final req = http.MultipartRequest('POST', url);
    final ext = filename.split('.').last.toLowerCase();
    MediaType contentType = MediaType('application', 'pdf');
    if (ext == 'docx') {
      contentType = MediaType('application', 'vnd.openxmlformats-officedocument.wordprocessingml.document');
    }

    req.files.add(
      http.MultipartFile.fromBytes(
        'file',
        fileBytes,
        filename: filename,
        contentType: contentType,
      ),
    );

    final streamedRes = await req.send().timeout(const Duration(seconds: 35));
    final res = await http.Response.fromStream(streamedRes);

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      return ResumeParseResult.fromJson(data);
    } else {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? 'Resume processing failed');
    }
  }

  // 6. Upload Custom Avatar Image to Cloudinary
  Future<String> uploadAvatar(List<int> imageBytes, String filename, String userId) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/student/upload-avatar');

    final req = http.MultipartRequest('POST', url);
    req.fields['user_id'] = userId.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_');

    req.files.add(
      http.MultipartFile.fromBytes(
        'file',
        imageBytes,
        filename: filename,
        contentType: MediaType('image', 'jpeg'),
      ),
    );

    final streamedRes = await req.send().timeout(const Duration(seconds: 15));
    final res = await http.Response.fromStream(streamedRes);

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      return data['url'] ?? '';
    } else {
      throw Exception('Avatar upload failed');
    }
  }

  // 7. Sync User with MongoDB Atlas Auth collection
  Future<Map<String, dynamic>> syncUser({
    required String email,
    required String name,
    String? photoUrl,
    String provider = 'google',
  }) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/auth/sync');

    final payload = {
      'firebase_uid': 'fl_${email.hashCode}',
      'email': email.trim().toLowerCase(),
      'name': name,
      'photo_url': photoUrl,
      'auth_provider': provider,
      'providers': [provider],
      'email_verified': true,
    };

    try {
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('Sync user error: $e');
    }
    return {'status': 'error'};
  }
}
