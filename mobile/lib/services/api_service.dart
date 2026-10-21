import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/student_profile.dart';
import '../models/prediction.dart';
import '../models/resume_parse_result.dart';
import '../models/trace_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  static const String _prefApiUrlKey = 'custom_api_url';

  // Production Render backend as default across Android, iOS, and Web:
  String get defaultBaseUrl {
    return 'https://mirrormind-backend-z9vb.onrender.com';
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

  // 4. Update Academic Credentials in MongoDB
  Future<StudentProfile> updateAcademics({
    required String email,
    required double cgpa,
    required String collegeName,
    String? branch,
    int? semester,
  }) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/student/profile/${Uri.encodeComponent(email.trim().toLowerCase())}');

    final payload = <String, dynamic>{
      'cgpa': cgpa,
      'college_name': collegeName,
      'branch': ?branch,
      'semester': ?semester,
    };

    final res = await http.put(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    ).timeout(const Duration(seconds: 10));

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      return StudentProfile.fromJson(data);
    } else {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? 'Failed to update academic profile');
    }
  }

  // 5. Trigger PyTorch ML Career Prediction
  Future<PredictResponse> predictCareer({
    required String email,
    required List<String> skills,
    double? cgpa,
    int? projectsCount,
    int? internshipsCount,
  }) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/ml/predict');

    final payload = <String, dynamic>{
      'email': email.trim().toLowerCase(),
      'skills': skills,
      'cgpa': ?cgpa,
      'projects_count': ?projectsCount,
      'internships_count': ?internshipsCount,
    };

    final res = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    ).timeout(const Duration(seconds: 25));

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      return PredictResponse.fromJson(data);
    } else {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? 'Career prediction inference failed');
    }
  }

  // 6. Live ML Pipeline Instrumented Forward Pass (/api/ml/trace)
  Future<TraceResponse> getMLTrace({
    required List<String> skills,
    double? cgpa,
    int? projectsCount,
    int? internshipsCount,
  }) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/ml/trace');

    final payload = {
      'skills': skills.isNotEmpty ? skills : ['Python', 'FastAPI', 'PyTorch'],
      'cgpa': cgpa ?? 8.5,
      'projects_count': projectsCount ?? 3,
      'internships_count': internshipsCount ?? 1,
    };

    try {
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 20));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return TraceResponse.fromJson(data);
      } else {
        throw Exception('Trace inference failed: ${res.statusCode}');
      }
    } catch (e) {
      debugPrint('ML Trace fetch error: $e. Returning synthetic fallback trace.');
      return _generateFallbackTrace(skills, cgpa ?? 8.5);
    }
  }

  // 7. Grounded RAG: List User Documents
  Future<List<Map<String, dynamic>>> getKnowledgeDocuments(String userId) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/rag/documents?user_id=${Uri.encodeComponent(userId.trim().toLowerCase())}');

    try {
      final res = await http.get(url).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final docs = data['documents'] as List<dynamic>? ?? [];
        return docs.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    } catch (e) {
      debugPrint('Get documents error: $e');
    }
    return [];
  }

  // 8. Grounded RAG: Query Vector Vault
  Future<Map<String, dynamic>> queryKnowledgeVault({
    required String userId,
    required String question,
  }) async {
    final base = await getBaseUrl();
    final url = Uri.parse('$base/api/rag/query');

    final payload = {
      'user_id': userId.trim().toLowerCase(),
      'question': question.trim(),
      'match_threshold': 0.65,
      'max_sources': 4,
    };

    final res = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    ).timeout(const Duration(seconds: 25));

    if (res.statusCode == 200) {
      return jsonDecode(res.body) as Map<String, dynamic>;
    } else {
      final err = jsonDecode(res.body);
      throw Exception(err['detail'] ?? 'Knowledge Vault query failed');
    }
  }

  // 9. Upload Resume (.pdf/.docx) to Cloudinary & Extract via Gemini
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

  // 10. Upload Custom Avatar Image
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

  // 11. Sync User with MongoDB Atlas Auth collection
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

  // Safe fallback trace generator for offline / simulated preview
  TraceResponse _generateFallbackTrace(List<String> skills, double cgpa) {
    final rawTokens = ['[CLS]', 'skills', ':', ...skills.take(12), 'cgpa', ':', cgpa.toString(), '[SEP]'];
    final attentionMat = List.generate(
      rawTokens.length,
      (i) => List.generate(rawTokens.length, (j) => (i == j ? 0.35 : 0.65 / (rawTokens.length - 1))),
    );

    return TraceResponse(
      narrative: 'Profile with skills: ${skills.join(", ")} | CGPA: $cgpa',
      tokens: rawTokens,
      allTokens: rawTokens,
      tokenCount: rawTokens.length,
      attention: attentionMat,
      pooled: List.generate(384, (i) => (i % 7 == 0 ? 0.08 : (i % 3 == 0 ? -0.05 : 0.02))),
      embedding: List.generate(384, (i) => (i % 5 == 0 ? 0.12 : -0.03)),
      embeddingNorm: 1.0000,
      activations: TraceActivations(
        layer1: List.generate(512, (i) => (i % 4 == 0 ? 0.0 : 0.45)),
        layer2: List.generate(256, (i) => (i % 3 == 0 ? 0.0 : 0.62)),
        layer3: List.generate(128, (i) => (i % 2 == 0 ? 0.0 : 0.78)),
      ),
      logits: [3.45, 2.80, 2.15, 1.90, 1.45, 0.95, 0.80, 0.60, 0.40, 0.20],
      probs: [0.42, 0.24, 0.14, 0.08, 0.05, 0.03, 0.02, 0.01, 0.005, 0.005],
      roles: [
        RoleMeta(token: 'AIML_ENGINEER', label: 'AI/ML Engineer', index: 0),
        RoleMeta(token: 'BACKEND_DEVELOPER', label: 'Backend Developer', index: 1),
        RoleMeta(token: 'FULLSTACK_DEVELOPER', label: 'Fullstack Developer', index: 2),
        RoleMeta(token: 'DATA_SCIENTIST', label: 'Data Scientist', index: 3),
        RoleMeta(token: 'CLOUD_DEVOPS_ENGINEER', label: 'Cloud DevOps Engineer', index: 4),
      ],
      predictions: [
        RolePrediction(rank: 1, role: 'AIML_ENGINEER', label: 'AI/ML Engineer', confidence: 0.42),
        RolePrediction(rank: 2, role: 'BACKEND_DEVELOPER', label: 'Backend Developer', confidence: 0.24),
        RolePrediction(rank: 3, role: 'FULLSTACK_DEVELOPER', label: 'Fullstack Developer', confidence: 0.14),
        RolePrediction(rank: 4, role: 'DATA_SCIENTIST', label: 'Data Scientist', confidence: 0.08),
        RolePrediction(rank: 5, role: 'CLOUD_DEVOPS_ENGINEER', label: 'Cloud DevOps Engineer', confidence: 0.05),
      ],
      latencyMs: TraceLatency(tokenize: 1.8, encode: 28.4, mlp: 1.2, total: 31.4),
      modelInfo: ModelInfo(
        encoder: 'sentence-transformers/all-MiniLM-L6-v2',
        mlpParams: 246538,
        mlpBytes: 986152,
        inputDim: 384,
        hiddenDims: [512, 256, 128],
        numClasses: 10,
      ),
    );
  }
}
