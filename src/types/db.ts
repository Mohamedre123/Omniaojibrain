export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  brand_voice: string | null;
  brand_name: string | null;
  brand_colors: string[];
  brand_logo_url: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  brief: string | null;
  business_type: string;
  cover_color: string;
  share_token: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  project_id: string;
  user_id: string;
  mode: "chat" | "strategy" | "design" | "video";
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  attachments: Array<{ url: string; type: string; name?: string }>;
  created_at: string;
};

export type Deliverable = {
  id: string;
  project_id: string;
  user_id: string;
  kind: "strategy" | "design_prompt" | "video_prompt" | "script" | "note";
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};
