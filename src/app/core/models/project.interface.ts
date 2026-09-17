export interface Project {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  description?: string;
  excerpt?: string;
  coverUrl?: string;
  category?: string;
  status: 'draft' | 'active' | 'completed' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  owner?: string;
  ownerName?: string;
  createdAt?: string;
}

export interface ProjectListData {
  items: Project[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
