import { LoginInput, RegisterInput } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8;
}

export function validateLoginInput(input: any): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Input body must be an object'] };
  }

  if (!input.email || typeof input.email !== 'string') {
    errors.push('Email is required and must be a string');
  } else if (!isValidEmail(input.email)) {
    errors.push('Email format is invalid');
  }

  if (!input.password || typeof input.password !== 'string') {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRegisterInput(input: any): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Input body must be an object'] };
  }

  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!input.email || typeof input.email !== 'string') {
    errors.push('Email is required');
  } else if (!isValidEmail(input.email)) {
    errors.push('Email format is invalid');
  }

  if (!input.password || typeof input.password !== 'string') {
    errors.push('Password is required');
  } else if (!isValidPassword(input.password)) {
    errors.push('Password must be at least 8 characters long');
  }

  const validRoles = ['admin', 'operator', 'reviewer', 'auditor'];
  if (input.role && !validRoles.includes(input.role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateProjectInput(input: any): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Input must be an object'] };
  }

  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.push('Project title is required');
  }

  if (!input.codeName || typeof input.codeName !== 'string' || input.codeName.trim().length === 0) {
    errors.push('Project codeName is required');
  }

  if (!input.target || typeof input.target !== 'string' || input.target.trim().length === 0) {
    errors.push('Project target is required');
  }

  const validRisks = ['low', 'medium', 'high', 'extreme'];
  if (input.riskLevel && !validRisks.includes(input.riskLevel)) {
    errors.push(`Risk level must be one of: ${validRisks.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
