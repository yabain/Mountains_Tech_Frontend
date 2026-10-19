import { AuthUser } from '../../core/auth/services/auth.service';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'COMMUNICATION';
export type AdminPermission =
  | 'dashboard'
  | 'users'
  | 'audit-logs'
  | 'member-applications'
  | 'settings'
  | 'media'
  | 'contacts'
  | 'members'
  | 'projects'
  | 'activities'
  | 'events'
  | 'hackathons'
  | 'partners'
  | 'newsletter'
  | 'announcements';

export interface AdminNavItem {
  permission: AdminPermission;
  label: string;
  route: string;
  icon: string;
  group: 'principal' | 'contenu' | 'système';
}

export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  SUPER_ADMIN: ['dashboard', 'users', 'audit-logs', 'member-applications', 'settings', 'media', 'members', 'contacts', 'events', 'activities', 'projects', 'hackathons', 'partners', 'newsletter', 'announcements'],
  ADMIN: ['dashboard', 'users', 'member-applications', 'settings', 'media', 'members', 'contacts', 'events', 'activities', 'projects', 'hackathons', 'partners', 'newsletter', 'announcements'],
  EDITOR: ['activities', 'events', 'projects', 'hackathons', 'media', 'settings'],
  COMMUNICATION: ['announcements', 'newsletter', 'contacts', 'media', 'settings']
};

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { permission: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: 'bi-grid-1x2-fill', group: 'principal' },
  { permission: 'users', label: 'Utilisateurs', route: '/dashboard/users', icon: 'bi-people-fill', group: 'principal' },
  { permission: 'audit-logs', label: 'Journaux d’audit', route: '/dashboard/audit-logs', icon: 'bi-journal-text', group: 'système' },
  { permission: 'members', label: 'Membres', route: '/dashboard/members', icon: 'bi-person-badge-fill', group: 'contenu' },
  { permission: 'member-applications', label: 'Demandes d’adhésion', route: '/dashboard/members/applications', icon: 'bi-person-vcard-fill', group: 'contenu' },
  { permission: 'contacts', label: 'Contacts', route: '/dashboard/contacts', icon: 'bi-person-lines-fill', group: 'contenu' },
  { permission: 'events', label: 'Événements', route: '/dashboard/events', icon: 'bi-calendar-event-fill', group: 'contenu' },
  { permission: 'activities', label: 'Activités', route: '/dashboard/activities', icon: 'bi-lightning-charge-fill', group: 'contenu' },
  { permission: 'projects', label: 'Projets', route: '/dashboard/projects', icon: 'bi-kanban-fill', group: 'contenu' },
  { permission: 'hackathons', label: 'Hackathons', route: '/dashboard/hackathons', icon: 'bi-trophy-fill', group: 'contenu' },
  { permission: 'partners', label: 'Partenaires', route: '/dashboard/partners', icon: 'bi-building-fill', group: 'contenu' },
  { permission: 'media', label: 'Médias', route: '/dashboard/media', icon: 'bi-images', group: 'contenu' },
  { permission: 'newsletter', label: 'Prospects', route: '/dashboard/newsletter', icon: 'bi-person-lines-fill', group: 'contenu' },
  { permission: 'newsletter', label: 'E-mails', route: '/dashboard/email-settings', icon: 'bi-envelope-at-fill', group: 'contenu' },
  { permission: 'announcements', label: 'Annonces', route: '/dashboard/announcements', icon: 'bi-megaphone-fill', group: 'contenu' },
  { permission: 'settings', label: 'Paramètres', route: '/dashboard/settings', icon: 'bi-sliders', group: 'système' }
];

export function normalizeRole(role: string): AdminRole | null {
  const normalized = role.toUpperCase() as AdminRole;
  return normalized in ROLE_PERMISSIONS ? normalized : null;
}

export function permissionsForUser(user: AuthUser | null): readonly AdminPermission[] {
  const role = user ? normalizeRole(user.role) : null;
  return role ? ROLE_PERMISSIONS[role] : [];
}

export function navigationForUser(user: AuthUser | null): readonly AdminNavItem[] {
  const permissions = permissionsForUser(user);
  return ADMIN_NAV_ITEMS.filter((item) => permissions.includes(item.permission));
}
