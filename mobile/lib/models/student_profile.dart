class ProjectItem {
  final String? id;
  final String title;
  final String description;
  final List<String> techStack;
  final String? githubUrl;
  final String? liveDemoUrl;

  ProjectItem({
    this.id,
    required this.title,
    required this.description,
    this.techStack = const [],
    this.githubUrl,
    this.liveDemoUrl,
  });

  factory ProjectItem.fromJson(Map<String, dynamic> json) {
    return ProjectItem(
      id: json['id'],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      techStack: (json['tech_stack'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      githubUrl: json['github_url'],
      liveDemoUrl: json['live_demo_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'title': title,
      'description': description,
      'tech_stack': techStack,
      if (githubUrl != null) 'github_url': githubUrl,
      if (liveDemoUrl != null) 'live_demo_url': liveDemoUrl,
    };
  }
}

class InternshipItem {
  final String? id;
  final String companyName;
  final String? domain;
  final String role;
  final String? startDate;
  final String? endDate;
  final bool isCurrent;
  final String? description;

  InternshipItem({
    this.id,
    required this.companyName,
    this.domain,
    required this.role,
    this.startDate,
    this.endDate,
    this.isCurrent = false,
    this.description,
  });

  factory InternshipItem.fromJson(Map<String, dynamic> json) {
    return InternshipItem(
      id: json['id'],
      companyName: json['company_name'] ?? '',
      domain: json['domain'],
      role: json['role'] ?? '',
      startDate: json['start_date'],
      endDate: json['end_date'],
      isCurrent: json['is_current'] ?? false,
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'company_name': companyName,
      if (domain != null) 'domain': domain,
      'role': role,
      if (startDate != null) 'start_date': startDate,
      if (endDate != null) 'end_date': endDate,
      'is_current': isCurrent,
      if (description != null) 'description': description,
    };
  }
}

class StudentProfile {
  final String? id;
  final String? userId;
  final String name;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final String? githubUrl;
  final String? linkedinUrl;

  // Academics
  final String? collegeName;
  final String collegeTier;
  final String branch;
  final int semester;
  final double cgpa;
  final int backlogCount;

  // Preferences
  final String careerInterest;
  final int communicationRating;
  final String workStylePref;

  // Technical
  final List<String> skills;
  final List<String> certifications;
  final List<ProjectItem> projects;
  final List<InternshipItem> internships;

  // Resume
  final String? resumeUrl;
  final String? resumeFilename;

  // Predictions cached
  final List<Map<String, dynamic>>? predictions;
  final String? topPrediction;
  final String? topInsight;
  final Map<String, int>? skillRadar;

  StudentProfile({
    this.id,
    this.userId,
    required this.name,
    required this.email,
    this.phone,
    this.avatarUrl,
    this.githubUrl,
    this.linkedinUrl,
    this.collegeName,
    this.collegeTier = 'Tier-2',
    this.branch = 'Computer Science & Engineering',
    this.semester = 6,
    this.cgpa = 8.0,
    this.backlogCount = 0,
    this.careerInterest = 'AIML_ENGINEER',
    this.communicationRating = 4,
    this.workStylePref = 'hybrid',
    this.skills = const [],
    this.certifications = const [],
    this.projects = const [],
    this.internships = const [],
    this.resumeUrl,
    this.resumeFilename,
    this.predictions,
    this.topPrediction,
    this.topInsight,
    this.skillRadar,
  });

  factory StudentProfile.fromJson(Map<String, dynamic> json) {
    return StudentProfile(
      id: json['id'] ?? json['_id'],
      userId: json['user_id'],
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      avatarUrl: json['avatar_url'],
      githubUrl: json['github_url'],
      linkedinUrl: json['linkedin_url'],
      collegeName: json['college_name'],
      collegeTier: json['college_tier'] ?? 'Tier-2',
      branch: json['branch'] ?? 'Computer Science',
      semester: json['semester'] ?? 6,
      cgpa: (json['cgpa'] as num?)?.toDouble() ?? 7.5,
      backlogCount: json['backlog_count'] ?? 0,
      careerInterest: json['career_interest'] ?? 'AIML_ENGINEER',
      communicationRating: json['communication_rating'] ?? 4,
      workStylePref: json['work_style_pref'] ?? 'hybrid',
      skills: (json['skills'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      certifications: (json['certifications'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      projects: (json['projects'] as List<dynamic>?)
              ?.map((e) => ProjectItem.fromJson(Map<String, dynamic>.from(e)))
              .toList() ??
          [],
      internships: (json['internships'] as List<dynamic>?)
              ?.map((e) => InternshipItem.fromJson(Map<String, dynamic>.from(e)))
              .toList() ??
          [],
      resumeUrl: json['resume_url'],
      resumeFilename: json['resume_filename'],
      predictions: (json['predictions'] as List<dynamic>?)
          ?.map((e) => Map<String, dynamic>.from(e))
          .toList(),
      topPrediction: json['top_prediction'],
      topInsight: json['top_insight'],
      skillRadar: (json['skill_radar'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, (v as num).toInt())),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      'name': name,
      'email': email,
      if (phone != null) 'phone': phone,
      if (avatarUrl != null) 'avatar_url': avatarUrl,
      if (githubUrl != null) 'github_url': githubUrl,
      if (linkedinUrl != null) 'linkedin_url': linkedinUrl,
      if (collegeName != null) 'college_name': collegeName,
      'college_tier': collegeTier,
      'branch': branch,
      'semester': semester,
      'cgpa': cgpa,
      'backlog_count': backlogCount,
      'career_interest': careerInterest,
      'communication_rating': communicationRating,
      'work_style_pref': workStylePref,
      'skills': skills,
      'certifications': certifications,
      'projects': projects.map((p) => p.toJson()).toList(),
      'internships': internships.map((i) => i.toJson()).toList(),
      if (resumeUrl != null) 'resume_url': resumeUrl,
      if (resumeFilename != null) 'resume_filename': resumeFilename,
    };
  }
}
