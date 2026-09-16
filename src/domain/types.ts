export type ProjectStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'aborted';

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  tier: 'syndicate_standard' | 'syndicate_elite';
  createdAt: string;
}

export interface HeistProject {
  id: string;
  title: string;
  codeName: string;
  target: string;
  estimatedTake: number;
  riskLevel: RiskLevel;
  status: ProjectStatus;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  id: string;
  projectId: string;
  requestedBy: string;
  status: ApprovalStatus;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  fileType: string;
  sizeBytes: number;
  checksum: string;
  uploadedBy: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}
