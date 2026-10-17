class ExtractedResumeData {
  final String? name;
  final String? email;
  final String? phone;
  final String? college;
  final String? branch;
  final double? cgpa;
  final List<String> skills;
  final List<Map<String, dynamic>> projects;
  final List<Map<String, dynamic>> internships;
  final List<String> certifications;
  final String? githubUrl;
  final String? linkedinUrl;

  ExtractedResumeData({
    this.name,
    this.email,
    this.phone,
    this.college,
    this.branch,
    this.cgpa,
    this.skills = const [],
    this.projects = const [],
    this.internships = const [],
    this.certifications = const [],
    this.githubUrl,
    this.linkedinUrl,
  });

  factory ExtractedResumeData.fromJson(Map<String, dynamic> json) {
    return ExtractedResumeData(
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      college: json['college'],
      branch: json['branch'],
      cgpa: (json['cgpa'] as num?)?.toDouble(),
      skills: (json['skills'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      projects: (json['projects'] as List<dynamic>?)?.map((e) => Map<String, dynamic>.from(e)).toList() ?? [],
      internships: (json['internships'] as List<dynamic>?)?.map((e) => Map<String, dynamic>.from(e)).toList() ?? [],
      certifications: (json['certifications'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      githubUrl: json['github_url'],
      linkedinUrl: json['linkedin_url'],
    );
  }
}

class ResumeParseResult {
  final String status;
  final String filename;
  final String cloudinaryUrl;
  final ExtractedResumeData extractedData;

  ResumeParseResult({
    required this.status,
    required this.filename,
    required this.cloudinaryUrl,
    required this.extractedData,
  });

  factory ResumeParseResult.fromJson(Map<String, dynamic> json) {
    return ResumeParseResult(
      status: json['status'] ?? 'success',
      filename: json['filename'] ?? '',
      cloudinaryUrl: json['cloudinary_url'] ?? '',
      extractedData: ExtractedResumeData.fromJson(
        Map<String, dynamic>.from(json['extracted_data'] ?? {}),
      ),
    );
  }
}
