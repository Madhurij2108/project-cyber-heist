import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateRegisterInput,
  validateLoginInput,
  validateProjectInput,
  validateApprovalInput,
  validateUploadInput,
  validateCommentInput
} from '../auth/validation';

describe('Validation Helpers', () => {
  describe('Email & Password', () => {
    it('validates proper email formats', () => {
      expect(validateEmail('test@cyberheist.local')).toBe(true);
      expect(validateEmail('admin@cyberheist.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null as any)).toBe(false);
    });

    it('validates password length', () => {
      expect(validatePassword('123456').valid).toBe(true);
      expect(validatePassword('12345').valid).toBe(false);
      expect(validatePassword(null as any).valid).toBe(false);
    });
  });

  describe('Request Payloads', () => {
    it('validates register payload', () => {
      const valid = validateRegisterInput({
        username: 'infiltrator',
        email: 'infiltrator@cyberheist.local',
        password: 'Password123!',
        role: 'operator'
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);

      const invalid = validateRegisterInput({
        username: 'ab',
        email: 'bad',
        password: '123',
        role: 'invalid-role'
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('validates login payload', () => {
      expect(validateLoginInput({ email: 'admin@cyberheist.local', password: 'Pass' }).valid).toBe(true);
      expect(validateLoginInput({ email: 'bad', password: 'Pass' }).valid).toBe(false);
      expect(validateLoginInput({}).valid).toBe(false);
    });

    it('validates project payload', () => {
      const valid = validateProjectInput({
        title: 'Project Apex',
        target_system: 'Apex Vault Mainframe',
        risk_level: 'critical',
        budget: 500000
      });
      expect(valid.valid).toBe(true);

      const invalid = validateProjectInput({
        title: '',
        target_system: '',
        risk_level: 'invalid_level',
        budget: -100
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('validates approval payload', () => {
      expect(validateApprovalInput({ project_id: 'proj-1' }).valid).toBe(true);
      expect(validateApprovalInput({}).valid).toBe(false);
    });

    it('validates upload payload', () => {
      expect(validateUploadInput({ project_id: 'proj-1', file_name: 'exploit.bin' }).valid).toBe(true);
      expect(validateUploadInput({ project_id: 'proj-1' }).valid).toBe(false);
    });

    it('validates comment payload', () => {
      expect(validateCommentInput({ project_id: 'proj-1', content: 'Node breached' }).valid).toBe(true);
      expect(validateCommentInput({ project_id: 'proj-1', content: '   ' }).valid).toBe(false);
    });
  });
});
