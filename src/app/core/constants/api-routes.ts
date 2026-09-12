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
    activities: '/public/activities',
    events: '/public/events',
    projects: '/public/projects',
    hackathons: '/public/hackathons',
    contact: '/public/contact',
    newsletter: '/public/newsletter/subscriptions',
    settings: '/public/settings'
  },
  admin: {
    users: '/admin/users',
    activities: '/admin/activities',
    events: '/admin/events',
    projects: '/admin/projects',
    hackathons: '/admin/hackathons',
    members: '/admin/members',
    contacts: '/admin/contacts',
    newsletter: '/admin/newsletter/subscribers',
    announcements: '/admin/announcements',
    media: '/admin/media',
    settings: '/admin/settings',
    dashboard: '/admin/dashboard',
    auditLogs: '/admin/audit-logs',
    partners: '/admin/partners'
  }
} as const;
