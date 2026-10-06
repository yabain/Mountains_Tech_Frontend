export interface Hackathon {
  id: string;
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  coverUrl?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  maxTeams?: number;
  registrationRequired?: boolean;
  status?: string;
}

export interface HackathonListData {
  items: Hackathon[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
