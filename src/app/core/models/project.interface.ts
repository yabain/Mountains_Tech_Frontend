export interface Project {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description?: string;
  excerpt?: string;
  coverUrl?: string;
  category?: string;
  status: 'draft' | 'active' | 'completed' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  owner?: string;
  ownerName?: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  partners?: string[];
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
