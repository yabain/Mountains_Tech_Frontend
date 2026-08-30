export interface Team {
  id: string;
  name: string;
  project?: string;
  members: string[];
  status: 'pending' | 'active' | 'completed';
}
