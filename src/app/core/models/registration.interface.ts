export interface Registration {
  id: string;
  userId: string;
  eventId?: string;
  hackathonId?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: string;
}
