export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt?: string;
}
