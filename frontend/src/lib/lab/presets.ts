import { PresetBundle } from "@/types/trace";

export interface PresetMeta {
  id: string;
  name: string;
  category: string;
  tagline: string;
  skills: string[];
  cgpa: number;
  projects_count: number;
  internships_count: number;
  expectedTop: string;
  expectedSecondary?: string;
  jsonPath: string;
}

export const PRESET_LIST: PresetMeta[] = [
  {
    id: "fullstack_ui_polyglot",
    name: "Fullstack & UI Polyglot",
    category: "Web & Client Platforms",
    tagline: "Modern responsive web applications, mobile Flutter UX, and high-velocity fullstack feature delivery.",
    skills: ["React", "Next.js", "Flutter", "TailwindCSS", "TypeScript", "GraphQL", "Mobile UI/UX", "CSS"],
    cgpa: 8.5,
    projects_count: 4,
    internships_count: 1,
    expectedTop: "Fullstack Developer (67.2%)",
    expectedSecondary: "Frontend Developer (32.7%)",
    jsonPath: "/presets/fullstack_ui_polyglot.json",
  },
  {
    id: "applied_ai_data_scientist",
    name: "Applied AI & Data Scientist",
    category: "Machine Learning & Analytics",
    tagline: "Predictive neural modeling, statistical exploratory analysis, and FastAPI microservice serving.",
    skills: ["Python", "Data Science", "Machine Learning", "FastAPI", "SQL", "Pandas"],
    cgpa: 8.6,
    projects_count: 3,
    internships_count: 1,
    expectedTop: "AI / ML Engineer (71.3%)",
    expectedSecondary: "Backend Developer (11.5%)",
    jsonPath: "/presets/applied_ai_data_scientist.json",
  },
  {
    id: "backend_cloud_architect",
    name: "Backend & Cloud API Architect",
    category: "Distributed Systems & APIs",
    tagline: "High-throughput RESTful services, relational data models, caching layers, and containerized Docker runtimes.",
    skills: ["Python", "SQL", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
    cgpa: 8.6,
    projects_count: 3,
    internships_count: 1,
    expectedTop: "Backend Developer (73.6%)",
    expectedSecondary: "Fullstack Developer (21.7%)",
    jsonPath: "/presets/backend_cloud_architect.json",
  },
  {
    id: "devops_cloud_sre",
    name: "DevOps & Cloud SRE",
    category: "Cloud Infrastructure & SRE",
    tagline: "Automated deployment pipelines, infrastructure as code, container orchestration, and system reliability.",
    skills: ["Docker", "Kubernetes", "Jenkins", "Ansible", "AWS", "Python", "Git"],
    cgpa: 8.5,
    projects_count: 3,
    internships_count: 1,
    expectedTop: "DevOps & Cloud Engineer (73.4%)",
    expectedSecondary: "Data Engineer (13.2%)",
    jsonPath: "/presets/devops_cloud_sre.json",
  },
  {
    id: "data_platform_systems",
    name: "Data Platform & Systems Specialist",
    category: "Data Systems & AI Integration",
    tagline: "Distributed data pipelines, Transformer model integration, document ingestion, and scalable databases.",
    skills: ["Python", "FastAPI", "PyTorch", "Docker", "Deep Learning", "React", "MongoDB", "Transformers"],
    cgpa: 9.2,
    projects_count: 4,
    internships_count: 2,
    expectedTop: "Data Engineer (51.3%)",
    expectedSecondary: "Fullstack Developer (40.3%)",
    jsonPath: "/presets/data_platform_systems.json",
  },
];

export async function fetchPresetBundle(presetId: string): Promise<PresetBundle> {
  const meta = PRESET_LIST.find((p) => p.id === presetId) || PRESET_LIST[0];
  const res = await fetch(meta.jsonPath);
  if (!res.ok) {
    throw new Error(`Failed to load preset bundle for ${presetId}: ${res.statusText}`);
  }
  return res.json();
}
