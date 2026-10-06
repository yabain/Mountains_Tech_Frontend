export interface Member {
  id: string;
  slug: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  role?: string;
  status: 'active' | 'pending' | 'inactive' | 'ACTIVE' | 'PENDING' | 'INACTIVE' | string;
  avatarUrl?: string;
  phone?: string;
  joinedAt?: string;
  createdAt?: string;
  // Champs détaillés
  logoUrl?: string;
  description?: string;
  website?: string;
  address?: string;
  sectors?: string[];
  employees?: number;
  representativeName?: string;
  representativeEmail?: string;
  legalForm?: string;
}

export interface MemberListData {
  items: Member[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
