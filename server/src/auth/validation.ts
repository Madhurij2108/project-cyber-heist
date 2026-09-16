export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
}

export function validateRegisterInput(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  if (!body.username || typeof body.username !== 'string' || body.username.trim().length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (!body.email || !validateEmail(body.email)) {
    errors.push('Valid email is required');
  }
  const passCheck = validatePassword(body.password);
  if (!passCheck.valid) {
    errors.push(passCheck.message || 'Invalid password');
  }
  if (body.role && !['admin', 'operator', 'analyst'].includes(body.role)) {
    errors.push('Role must be one of: admin, operator, analyst');
  }
  return { valid: errors.length === 0, errors };
}

export function validateLoginInput(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  if (!body.email || !validateEmail(body.email)) {
    errors.push('Valid email is required');
  }
  if (!body.password || typeof body.password !== 'string') {
    errors.push('Password is required');
  }
  return { valid: errors.length === 0, errors };
}

export function validateProjectInput(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    errors.push('Project title is required');
  }
  if (!body.target_system || typeof body.target_system !== 'string' || body.target_system.trim().length === 0) {
    errors.push('Target system is required');
  }
  if (body.status && !['draft', 'in_progress', 'review_pending', 'approved', 'completed', 'aborted'].includes(body.status)) {
    errors.push('Invalid project status');
  }
  if (body.risk_level && !['low', 'medium', 'high', 'critical'].includes(body.risk_level)) {
    errors.push('Invalid risk level');
  }
  if (body.budget !== undefined && (typeof body.budget !== 'number' || body.budget < 0)) {
    errors.push('Budget must be a non-negative number');
  }
  return { valid: errors.length === 0, errors };
}

export function validateApprovalInput(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  if (!body.project_id || typeof body.project_id !== 'string') {
    errors.push('Project ID is required');
  }
  return { valid: errors.length === 0, errors };
}

export function validateUploadInput(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  if (!body.project_id || typeof body.project_id !== 'string') {
    errors.push('Project ID is required');
  }
  if (!body.file_name || typeof body.file_name !== 'string') {
    errors.push('File name is required');
  }
  return { valid: errors.length === 0, errors };
}

export function validateCommentInput(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  if (!body.project_id || typeof body.project_id !== 'string') {
    errors.push('Project ID is required');
  }
  if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
    errors.push('Comment content is required');
  }
  return { valid: errors.length === 0, errors };
}
