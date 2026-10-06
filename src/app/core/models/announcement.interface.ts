export interface Announcement {
  id: string;
  subject: string;
  contentHtml: string;
  textContent?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  audience: AudienceFilter;
  recipientCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface AudienceFilter {
  type: 'ALL' | 'MEMBERS' | 'NEWSLETTER' | 'EVENT_PARTICIPANTS' | 'HACKATHON_TEAMS' | 'CUSTOM';
  memberStatuses?: string[]; // APPROVED, PENDING, etc.
  eventIds?: string[];
  hackathonIds?: string[];
  customTags?: string[];
  excludeUnsubscribed: boolean;
}

export interface AnnouncementRecipientCount {
  count: number;
}

export interface AnnouncementSendResponse {
  success: boolean;
  message: string;
  data?: {
    recipientCount: number;
    jobId: string;
  };
}

export interface AnnouncementPreviewData {
  subject: string;
  contentHtml: string;
  previewText?: string;
}