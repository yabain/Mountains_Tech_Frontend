export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
}