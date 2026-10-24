export interface AdminUserForm {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  password: string;
}

export const ADMIN_USER_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super-administrateur' },
  { value: 'ADMIN', label: 'Administrateur' },
  { value: 'EDITOR', label: 'Éditeur' },
  { value: 'COMMUNICATION', label: 'Chargé de communication' }
];

export { apiErrorMessage, asRecord } from '../../../core/utils/api-error';
