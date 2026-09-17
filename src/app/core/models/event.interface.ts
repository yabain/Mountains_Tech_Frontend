import { Partner } from './partner.interface';

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentHtml?: string;
  coverUrl?: string;
  category?: string;
  location?: string;
  startAt: string;
  endAt?: string;
  registrationRequired: boolean;
  capacity?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  partner?: Partner | null;
}

export interface EventListData {
  items: EventItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
