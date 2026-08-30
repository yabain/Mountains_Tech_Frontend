export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  owner?: string;
  createdAt?: string;
}
