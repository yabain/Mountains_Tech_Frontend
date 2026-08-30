export interface EventItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  type: 'workshop' | 'conference' | 'meetup';
}
