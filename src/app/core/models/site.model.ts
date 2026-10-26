export interface SiteData {
  hero: HeroSection;
  about: AboutSection;
  generalManager: GeneralManagerSection;
  values: ValuesSection;
  history: HistorySection;
  mission: { title: string; text: string };
  vision: { title: string; text: string };
  coreValues: { title: string; text: string }[];
  governance: { title: string; text: string }[];
  members: MemberItem[];
  activities: ActivityItem[];
  projects: ProjectItem[];
  hackathons: HackathonItem[];
  partners: PartnerItem[];
  newsletter: NewsletterSection;
}

export interface HeroSection {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stats: { label: string; value: string }[];
}

export interface AboutSection {
  title: string;
  eyebrow: string;
  description: string;
  launchDate: string;
  location: string;
  sourceUrl: string;
  highlights: { title: string; text: string }[];
  officeMembers: OfficeMember[];
}

export interface OfficeMember {
  id: number;
  name: string;
  role: string;
  detail?: string;
  company?: string;
  image?: string;
}

export interface GeneralManagerSection {
  eyebrow: string;
  title: string;
  role: string;
  company?: string;
  name: string;
  image?: string;
  paragraphs: string[];
  quote: string;
}

export interface ValuesSection {
  eyebrow: string;
  title: string;
  description: string;
  launchDate: string;
  location: string;
  sourceUrl: string;
  highlights: { title: string; text: string }[];
  officeMembers: OfficeMember[];
}

export interface HistorySection {
  eyebrow: string;
  title: string;
  description: string;
  items: { year: string; title: string; description: string }[];
}

export interface MemberItem {
  id: number;
  name: string;
  role: string;
  city: string;
  description: string;
  image: string;
}

export interface ActivityItem {
  id: number;
  title: string;
  description: string;
  image: string;
  category?: string;
  date?: string;
  publisherName?: string;
  publisherImage?: string;
}

export interface ProjectItem {
  id: number;
  title: string;
  description: string;
  image: string;
  tag: string;
}

export interface HackathonItem {
  id: number;
  title: string;
  description: string;
  image: string;
  date: string;
}

export interface PartnerItem {
  id: number;
  name: string;
  logo: string;
  website: string;
}

export interface NewsletterSection {
  title: string;
  description: string;
  buttonLabel: string;
  buttonLink: string;
  formFields: { name: string; label: string; type: string; placeholder: string }[];
}
