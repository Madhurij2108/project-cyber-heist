import {
  Workspace,
  HeistProject,
  ApprovalRequest,
  ProjectComment,
  ProjectDocument,
  AuditEvent,
  ProjectStatus,
  ApprovalStatus,
} from './types';
import { User } from '../auth/types';

export class DomainStore {
  public workspaces: Map<string, Workspace> = new Map();
  public users: Map<string, User> = new Map();
  public projects: Map<string, HeistProject> = new Map();
  public approvals: Map<string, ApprovalRequest> = new Map();
  public comments: Map<string, ProjectComment[]> = new Map();
  public documents: Map<string, ProjectDocument[]> = new Map();
  public auditEvents: AuditEvent[] = [];

  public clear(): void {
    this.workspaces.clear();
    this.users.clear();
    this.projects.clear();
    this.approvals.clear();
    this.comments.clear();
    this.documents.clear();
    this.auditEvents = [];
  }

  // Workspaces
  public addWorkspace(ws: Workspace): void {
    this.workspaces.set(ws.id, ws);
  }

  public getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  // Users
  public addUser(user: User): void {
    this.users.set(user.id, user);
  }

  public getUserByEmail(email: string): User | undefined {
    const normalized = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        return u;
      }
    }
    return undefined;
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  // Projects
  public addProject(project: HeistProject): void {
    this.projects.set(project.id, project);
  }

  public getProject(id: string): HeistProject | undefined {
    return this.projects.get(id);
  }

  public listProjects(organizationId?: string, status?: ProjectStatus): HeistProject[] {
    let list = Array.from(this.projects.values());
    if (organizationId) {
      list = list.filter((p) => p.organizationId === organizationId);
    }
    if (status) {
      list = list.filter((p) => p.status === status);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public updateProjectStatus(id: string, newStatus: ProjectStatus, actorId: string): HeistProject {
    const project = this.getProject(id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      draft: ['in_review', 'aborted'],
      in_review: ['approved', 'draft', 'aborted'],
      approved: ['in_progress', 'aborted'],
      in_progress: ['completed', 'aborted'],
      completed: [],
      aborted: ['draft'],
    };

    const allowed = validTransitions[project.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from '${project.status}' to '${newStatus}'`
      );
    }

    project.status = newStatus;
    project.updatedAt = new Date().toISOString();
    this.projects.set(id, project);

    return project;
  }

  // Approvals
  public addApproval(approval: ApprovalRequest): void {
    this.approvals.set(approval.id, approval);
  }

  public getApproval(id: string): ApprovalRequest | undefined {
    return this.approvals.get(id);
  }

  public listApprovals(projectId?: string): ApprovalRequest[] {
    let list = Array.from(this.approvals.values());
    if (projectId) {
      list = list.filter((a) => a.projectId === projectId);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public reviewApproval(
    id: string,
    status: ApprovalStatus,
    reviewedBy: string,
    notes?: string
  ): ApprovalRequest {
    const approval = this.getApproval(id);
    if (!approval) {
      throw new Error(`Approval ${id} not found`);
    }
    if (approval.status !== 'pending') {
      throw new Error(`Approval is already in status '${approval.status}'`);
    }

    approval.status = status;
    approval.reviewedBy = reviewedBy;
    approval.reviewedAt = new Date().toISOString();
    if (notes) approval.notes = notes;
    this.approvals.set(id, approval);

    // If approved, update the project status to 'approved'
    if (status === 'approved') {
      const project = this.getProject(approval.projectId);
      if (project && project.status === 'in_review') {
        project.status = 'approved';
        project.updatedAt = new Date().toISOString();
      }
    }

    return approval;
  }

  // Comments
  public addComment(comment: ProjectComment): void {
    const list = this.comments.get(comment.projectId) || [];
    list.push(comment);
    this.comments.set(comment.projectId, list);
  }

  public listComments(projectId: string): ProjectComment[] {
    return this.comments.get(projectId) || [];
  }

  // Documents
  public addDocument(doc: ProjectDocument): void {
    const list = this.documents.get(doc.projectId) || [];
    list.push(doc);
    this.documents.set(doc.projectId, list);
  }

  public listDocuments(projectId: string): ProjectDocument[] {
    return this.documents.get(projectId) || [];
  }

  // Audit
  public logAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditEvents.push(fullEvent);
    return fullEvent;
  }

  public listAuditEvents(resourceType?: string, actorId?: string): AuditEvent[] {
    let list = [...this.auditEvents];
    if (resourceType) {
      list = list.filter((e) => e.resourceType === resourceType);
    }
    if (actorId) {
      list = list.filter((e) => e.actorId === actorId);
    }
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}

export const store = new DomainStore();
