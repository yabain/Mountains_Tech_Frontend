export interface AdminUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  notificationContact: boolean;
  password: string;
}

export const ADMIN_USER_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super-administrateur' },
  { value: 'ADMIN', label: 'Administrateur' },
  { value: 'EDITOR', label: 'Éditeur' },
  { value: 'COMMUNICATION', label: 'Communicant' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'USER', label: 'Utilisateur' }
];

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const errorRecord = asRecord(error);
  const nestedError = asRecord(errorRecord?.['error']);
  const message = nestedError?.['message'] ?? errorRecord?.['message'];
  return typeof message === 'string' && message.trim() ? message : fallback;
}
