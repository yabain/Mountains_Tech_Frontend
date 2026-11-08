export const API_ROUTES = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password'
  },
  public: {
    home: '/public/home',
    members: '/public/members',
    memberApplications: '/public/members/applications',
    activities: '/public/activities',
    events: '/public/events',
    projects: '/public/projects',
    hackathons: '/public/hackathons',
    contact: '/public/contact',
    newsletter: '/public/newsletter/subscriptions',
    newsletterUnsubscribe: '/public/newsletter/unsubscribe',
    settings: '/public/settings',
    partners: '/public/partners'
  },
  admin: {
    users: '/admin/users',
    activities: '/admin/activities',
    events: '/admin/events',
    projects: '/admin/projects',
    hackathons: '/admin/hackathons',
    members: '/admin/members',
    memberApplications: '/admin/members/applications',
    contacts: '/admin/contacts',
    newsletter: '/admin/newsletter/subscribers',
    announcements: '/admin/announcements',
    media: '/admin/media',
    mediaUpload: '/admin/media/upload',
    mediaLink: '/admin/media/link',
    settings: '/admin/settings',
    dashboard: '/admin/dashboard',
    auditLogs: '/admin/audit-logs',
    emails: '/admin/emails',
    partners: '/admin/partners'
  }
} as const;

export const adminDynamicRoutes = {
  eventRegistrations: (id: string) => `/admin/events/${id}/registrations`,
  hackathonTeams: (id: string) => `/admin/hackathons/${id}/teams`,
  hackathonTeamStatus: (teamId: string) => `/admin/hackathons/teams/${teamId}/status`,
  memberApplicationStatus: (id: string) => `/admin/members/applications/${id}/status`,
  memberStatus: (id: string) => `/admin/members/${id}/status`,
  contactStatus: (id: string) => `/admin/contacts/${id}/status`,
  contactRead: (id: string) => `/admin/contacts/${id}/read`,
  announcementRecipients: (id: string) => `/admin/announcements/${id}/recipients`,
  announcementSend: (id: string) => `/admin/announcements/${id}/send`,
  announcementSchedule: (id: string) => `/admin/announcements/${id}/schedule`,
  announcementCancel: (id: string) => `/admin/announcements/${id}/cancel`,
  publicEventRegistrations: (eventId: string) => `/public/events/${eventId}/registrations`,
  publicHackathonTeams: (hackathonId: string) => `/public/hackathons/${hackathonId}/teams`,
  publicMemberSlug: (slug: string) => `/public/members/${slug}`,
  publicActivitySlug: (slug: string) => `/public/activities/${slug}`,
  publicEventSlug: (slug: string) => `/public/events/${slug}`,
  publicProjectSlug: (slug: string) => `/public/projects/${slug}`,
  publicHackathonSlug: (slug: string) => `/public/hackathons/${slug}`
};
