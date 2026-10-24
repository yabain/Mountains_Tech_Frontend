export type AnnouncementStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED';

export interface AnnouncementAudience {
  groups: string[];
  filters?: Record<string, unknown>;
}

export interface Announcement {
  id: string;
  subject: string;
  contentHtml: string;
  status: AnnouncementStatus;
  audience: AnnouncementAudience;
  recipientCount: number;
  sendMode?: 'NOW' | 'SCHEDULED';
  scheduledAt?: string;
  sentAt?: string;
  metrics?: { sent: number; failed: number; opened?: number; clicked?: number };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface AnnouncementPreviewData {
  subject: string;
  contentHtml: string;
}
