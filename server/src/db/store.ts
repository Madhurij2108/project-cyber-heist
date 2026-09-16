import { Pool } from 'pg';
import { User, Project, Approval, Upload, Comment, AuditEvent } from '../types';
import { config } from '../config';

export class Store {
  private pool: Pool | null = null;
  private isPostgresActive = false;

  // In-memory collections as reliable fallback and test storage
  public users: Map<string, User> = new Map();
  public projects: Map<string, Project> = new Map();
  public approvals: Map<string, Approval> = new Map();
  public uploads: Map<string, Upload> = new Map();
  public comments: Map<string, Comment> = new Map();
  public auditEvents: AuditEvent[] = [];

  constructor(databaseUrl?: string) {
    const url = databaseUrl || config.databaseUrl;
    if (url) {
      try {
        this.pool = new Pool({ connectionString: url, connectionTimeoutMillis: 2000 });
      } catch {
        this.pool = null;
      }
    }
  }

  async init(): Promise<void> {
    if (this.pool) {
      try {
        const client = await this.pool.connect();
        try {
          await client.query('SELECT 1');
          this.isPostgresActive = true;
        } finally {
          client.release();
        }
      } catch (err) {
        this.isPostgresActive = false;
      }
    }
  }

  async reset(): Promise<void> {
    this.users.clear();
    this.projects.clear();
    this.approvals.clear();
    this.uploads.clear();
    this.comments.clear();
    this.auditEvents = [];

    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM audit_events');
        await this.pool.query('DELETE FROM comments');
        await this.pool.query('DELETE FROM uploads');
        await this.pool.query('DELETE FROM approvals');
        await this.pool.query('DELETE FROM projects');
        await this.pool.query('DELETE FROM users');
      } catch (e) {
        // ignore in fallback
      }
    }
  }

  // --- Users ---
  async createUser(user: User): Promise<User> {
    this.users.set(user.id, { ...user });
    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.id, user.username, user.email, user.password_hash, user.role, user.created_at]
        );
      } catch (e) {
        // fallback memory preserves it
      }
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    if (this.isPostgresActive && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {
        // fall through to memory
      }
    }
    const lower = email.toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === lower) return { ...u };
    }
    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    if (this.isPostgresActive && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {
        // fall through to memory
      }
    }
    const u = this.users.get(id);
    return u ? { ...u } : null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    if (this.isPostgresActive && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {
        // fall through
      }
    }
    const lower = username.toLowerCase();
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === lower) return { ...u };
    }
    return null;
  }

  async listUsers(): Promise<User[]> {
    if (this.isPostgresActive && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM users ORDER BY created_at ASC');
        return res.rows;
      } catch (e) {
        // fallback
      }
    }
    return Array.from(this.users.values());
  }

  // --- Projects ---
  async createProject(project: Project): Promise<Project> {
    this.projects.set(project.id, { ...project });
    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO projects (id, title, description, target_system, status, risk_level, budget, owner_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            project.id,
            project.title,
            project.description,
            project.target_system,
            project.status,
            project.risk_level,
            project.budget,
            project.owner_id,
            project.created_at,
            project.updated_at
          ]
        );
      } catch (e) {
        // fallback
      }
    }
    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    if (this.isPostgresActive && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM projects WHERE id = $1', [id]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {
        // fallback
      }
    }
    const p = this.projects.get(id);
    return p ? { ...p } : null;
  }

  async listProjects(): Promise<Project[]> {
    if (this.isPostgresActive && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        return res.rows;
      } catch (e) {
        // fallback
      }
    }
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const existing = await this.getProject(id);
    if (!existing) return null;
    const updated: Project = {
      ...existing,
      ...updates,
      id,
      updated_at: new Date().toISOString()
    };
    this.projects.set(id, updated);
    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query(
          'UPDATE projects SET title = $1, description = $2, target_system = $3, status = $4, risk_level = $5, budget = $6, updated_at = $7 WHERE id = $8',
          [
            updated.title,
            updated.description,
            updated.target_system,
            updated.status,
            updated.risk_level,
            updated.budget,
            updated.updated_at,
            id
          ]
        );
      } catch (e) {
        // fallback
      }
    }
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    if (!this.projects.has(id)) return false;
    this.projects.delete(id);
    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM projects WHERE id = $1', [id]);
      } catch (e) {
        // fallback
      }
    }
    return true;
  }

  // --- Approvals ---
  async createApproval(approval: Approval): Promise<Approval> {
    this.approvals.set(approval.id, { ...approval });
    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO approvals (id, project_id, requested_by, approved_by, status, comments, requested_at, decided_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [
            approval.id,
            approval.project_id,
            approval.requested_by,
            approval.approved_by || null,
            approval.status,
            approval.comments || null,
            approval.requested_at,
            approval.decided_at || null
          ]
        );
      } catch (e) {
        // fallback
      }
    }
    return approval;
  }

  async getApproval(id: string): Promise<Approval | null> {
    if (this.isPostgresActive && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM approvals WHERE id = $1', [id]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {
        // fallback
      }
    }
    const a = this.approvals.get(id);
    return a ? { ...a } : null;
  }

  async listApprovals(projectId?: string): Promise<Approval[]> {
    if (this.isPostgresActive && this.pool) {
      try {
        const query = projectId
          ? 'SELECT * FROM approvals WHERE project_id = $1 ORDER BY requested_at DESC'
          : 'SELECT * FROM approvals ORDER BY requested_at DESC';
        const params = projectId ? [projectId] : [];
        const res = await this.pool.query(query, params);
        return res.rows;
      } catch (e) {
        // fallback
      }
    }
    const all = Array.from(this.approvals.values());
    if (projectId) {
      return all.filter((a) => a.project_id === projectId);
    }
    return all;
  }

  async updateApproval(id: string, updates: Partial<Approval>): Promise<Approval | null> {
    const existing = await this.getApproval(id);
    if (!existing) return null;
    const updated: Approval = {
      ...existing,
      ...updates,
      id
    };
    this.approvals.set(id, updated);
    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query(
          'UPDATE approvals SET status = $1, approved_by = $2, comments = $3, decided_at = $4 WHERE id = $5',
          [updated.status, updated.approved_by || null, updated.comments || null, updated.decided_at || null, id]
        );
      } catch (e) {
        // fallback
      }
    }
    return updated;
  }

  // --- Uploads ---
  async createUpload(upload: Upload): Promise<Upload> {
    this.uploads.set(upload.id, { ...upload });
    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO uploads (id, project_id, file_name, file_size, mime_type, file_path, uploaded_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [
            upload.id,
            upload.project_id,
            upload.file_name,
            upload.file_size,
            upload.mime_type,
            upload.file_path,
            upload.uploaded_by,
            upload.created_at
          ]
        );
      } catch (e) {
        // fallback
      }
    }
    return upload;
  }

  async listUploads(projectId?: string): Promise<Upload[]> {
    if (this.isPostgresActive && this.pool) {
      try {
        const query = projectId
          ? 'SELECT * FROM uploads WHERE project_id = $1 ORDER BY created_at DESC'
          : 'SELECT * FROM uploads ORDER BY created_at DESC';
        const params = projectId ? [projectId] : [];
        const res = await this.pool.query(query, params);
        return res.rows;
      } catch (e) {
        // fallback
      }
    }
    const all = Array.from(this.uploads.values());
    if (projectId) {
      return all.filter((u) => u.project_id === projectId);
    }
    return all;
  }

  // --- Comments ---
  async createComment(comment: Comment): Promise<Comment> {
    this.comments.set(comment.id, { ...comment });
    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO comments (id, project_id, author_id, author_name, content, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [comment.id, comment.project_id, comment.author_id, comment.author_name, comment.content, comment.created_at]
        );
      } catch (e) {
        // fallback
      }
    }
    return comment;
  }

  async listComments(projectId?: string): Promise<Comment[]> {
    if (this.isPostgresActive && this.pool) {
      try {
        const query = projectId
          ? 'SELECT * FROM comments WHERE project_id = $1 ORDER BY created_at ASC'
          : 'SELECT * FROM comments ORDER BY created_at ASC';
        const params = projectId ? [projectId] : [];
        const res = await this.pool.query(query, params);
        return res.rows;
      } catch (e) {
        // fallback
      }
    }
    const all = Array.from(this.comments.values());
    if (projectId) {
      return all.filter((c) => c.project_id === projectId);
    }
    return all;
  }

  // --- Audit Events ---
  async createAuditEvent(event: AuditEvent): Promise<AuditEvent> {
    this.auditEvents.unshift({ ...event });
    if (this.isPostgresActive && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO audit_events (id, action, actor_id, actor_name, target_type, target_id, details, ip_address, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            event.id,
            event.action,
            event.actor_id || null,
            event.actor_name || null,
            event.target_type || null,
            event.target_id || null,
            event.details ? JSON.stringify(event.details) : null,
            event.ip_address || null,
            event.timestamp
          ]
        );
      } catch (e) {
        // fallback
      }
    }
    return event;
  }

  async listAuditEvents(limit: number = 50): Promise<AuditEvent[]> {
    if (this.isPostgresActive && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT $1', [limit]);
        return res.rows;
      } catch (e) {
        // fallback
      }
    }
    return this.auditEvents.slice(0, limit);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export const defaultStore = new Store();
