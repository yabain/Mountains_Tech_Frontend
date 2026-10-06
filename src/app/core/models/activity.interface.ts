export interface Activity {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  imageUrl?: string;
  category?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  excerpt?: string;
  contentHtml?: string;
  coverUrl?: string;
}
