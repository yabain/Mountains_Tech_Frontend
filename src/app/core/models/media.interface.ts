export interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: 'image' | 'video' | 'document';
  uploadedAt?: string;
}
