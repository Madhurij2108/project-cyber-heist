export type Role = 'admin' | 'operator' | 'reviewer' | 'auditor';

export type Permission =
  | 'WORKSPACE_MANAGE'
  | 'USER_MANAGE'
  | 'PROJECT_CREATE'
  | 'PROJECT_READ'
  | 'PROJECT_UPDATE'
  | 'PROJECT_DELETE'
  | 'APPROVAL_SUBMIT'
  | 'APPROVAL_REVIEW'
  | 'COMMENT_CREATE'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_READ'
  | 'AUDIT_VIEW'
  | 'SYSTEM_CONFIG';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  permissions: Permission[];
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, 'passwordHash' | 'salt'>;

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  organizationId: string;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: SafeUser;
  expiresIn: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
  organizationId?: string;
}
