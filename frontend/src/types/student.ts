export interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  tech_stack: string[];
  github_url?: string;
  live_demo_url?: string;
}

export interface InternshipItem {
  id?: string;
  company_name: string;
  domain?: string;
  role: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
}

export interface PredictionItem {
  rank: number;
  role: string;
  label: string;
  confidence: number;
}

export interface NNLayerSpec {
  id: string;
  name: string;
  type: string;
  input_shape: number[];
  output_shape: number[];
  activation: string;
  regularization?: string;
  description: string;
}

export interface StudentProfile {
  id?: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  github_url?: string;
  linkedin_url?: string;

  // Academics
  college_name?: string;
  college_tier: "Tier-1" | "Tier-2" | "Tier-3" | string;
  branch: string;
  semester: number;
  cgpa: number;
  backlog_count: number;

  // Preferences
  career_interest?: string;
  communication_rating: number;
  work_style_pref: "remote" | "hybrid" | "startup" | "enterprise" | string;

  // Technical
  skills: string[];
  certifications?: string[];
  projects: ProjectItem[];
  internships: InternshipItem[];

  // Resume
  resume_url?: string;
  resume_filename?: string;

  // Predictions & Insights
  predictions?: PredictionItem[];
  top_prediction?: string;
  top_insight?: string;
  skill_radar?: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

export interface PredictResponse {
  profile_text: string;
  top_prediction: string;
  top_label: string;
  confidence: number;
  predictions: PredictionItem[];
  top_insight?: string;
  skill_radar?: Record<string, number>;
  embedding_dim?: number;
  embedding_preview?: number[];
  all_probabilities?: Record<string, number>;
  nn_layers?: NNLayerSpec[];
}

export interface ResumeParseResponse {
  status: string;
  filename: string;
  cloudinary_url: string;
  extracted_data: {
    name?: string;
    email?: string;
    phone?: string;
    college?: string;
    branch?: string;
    cgpa?: number;
    skills?: string[];
    projects?: Array<{
      title: string;
      description: string;
      tech_stack?: string[];
    }>;
    internships?: Array<{
      company_name: string;
      role: string;
      domain?: string;
    }>;
    certifications?: string[];
    github_url?: string;
    linkedin_url?: string;
  };
  raw_text_length: number;
}

export interface UserDocumentItem {
  id?: string;
  _id?: string;
  user_id: string;
  filename: string;
  category: string;
  file_type: string;
  file_size: number;
  processing_status: string;
  embedding_status: string;
  page_count: number;
  chunk_count: number;
  uploaded_at: string;
}

export interface CitationSourceItem {
  document_id: string;
  filename: string;
  category: string;
  page_start: number;
  page_end: number;
  score: number;
  text: string;
}

export interface RAGQueryResponseData {
  question: string;
  answer: string;
  citations: CitationSourceItem[];
  structured_profile_used: boolean;
  retrieved_chunks_count: number;
}

