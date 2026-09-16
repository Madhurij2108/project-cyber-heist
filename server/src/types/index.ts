export type Role = 'admin' | 'operator' | 'analyst';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

export type ProjectStatus = 'draft' | 'in_progress' | 'review_pending' | 'approved' | 'completed' | 'aborted';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  title: string;
  description: string;
  target_system: string;
  status: ProjectStatus;
  risk_level: RiskLevel;
  budget: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  project_id: string;
  requested_by: string;
  approved_by?: string;
  status: ApprovalStatus;
  comments?: string;
  requested_at: string;
  decided_at?: string;
}

export interface Upload {
  id: string;
  project_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface Comment {
  id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  actor_id?: string;
  actor_name?: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  username: string;
  role: Role;
}
