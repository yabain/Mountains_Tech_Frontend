export interface SiteData {
  hero: HeroSection;
  about: AboutSection;
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
  description: string;
  highlights: { title: string; text: string }[];
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
