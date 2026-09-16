import { User, Project, Approval, Upload, Comment, AuditEvent } from './types';

const API_BASE = '/api';

let authToken: string | null = localStorage.getItem('cyberheist_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('cyberheist_token', token);
  } else {
    localStorage.removeItem('cyberheist_token');
  }
}

export function getToken(): string | null {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status}`;
    try {
      const errData = await res.json();
      errorMsg = errData.error || (errData.errors ? errData.errors.join(', ') : errorMsg);
    } catch {
      // fallback to status
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    return data;
  },

  async register(username: string, email: string, password: string, role?: string): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role })
    });
    setToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },

  logout() {
    setToken(null);
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return request<Project[]>('/projects');
  },

  async getProject(id: string): Promise<Project> {
    return request<Project>(`/projects/${id}`);
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    });
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    return request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteProject(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE'
    });
  },

  // Approvals
  async getApprovals(projectId?: string): Promise<Approval[]> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return request<Approval[]>(`/approvals${query}`);
  },

  async requestApproval(projectId: string, comments?: string): Promise<Approval> {
    return request<Approval>('/approvals', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, comments })
    });
  },

  async decideApproval(id: string, status: 'approved' | 'rejected', comments?: string): Promise<Approval> {
    return request<Approval>(`/approvals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, comments })
    });
  },

  // Uploads
  async getUploads(projectId: string): Promise<Upload[]> {
    return request<Upload[]>(`/uploads?projectId=${encodeURIComponent(projectId)}`);
  },

  async createUpload(projectId: string, fileName: string, fileSize?: number, mimeType?: string): Promise<Upload> {
    return request<Upload>('/uploads', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        file_name: fileName,
        file_size: fileSize || 1024,
        mime_type: mimeType || 'application/octet-stream'
      })
    });
  },

  // Comments
  async getComments(projectId: string): Promise<Comment[]> {
    return request<Comment[]>(`/comments?projectId=${encodeURIComponent(projectId)}`);
  },

  async addComment(projectId: string, content: string): Promise<Comment> {
    return request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, content })
    });
  },

  // Audit
  async getAuditLog(limit?: number): Promise<AuditEvent[]> {
    const query = limit ? `?limit=${limit}` : '';
    return request<AuditEvent[]>(`/audit${query}`);
  },

  // Seed Reset
  async reseedData(): Promise<{ message: string }> {
    return request<{ message: string }>('/seed', {
      method: 'POST'
    });
  }
};
