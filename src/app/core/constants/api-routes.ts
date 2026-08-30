export const API_ROUTES = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    logout: '/auth/logout'
  },
  members: '/members',
  activities: '/activities',
  events: '/events',
  projects: '/projects',
  hackathons: '/hackathons',
  teams: '/teams',
  registrations: '/registrations',
  announcements: '/announcements',
  partners: '/partners',
  contacts: '/contacts',
  media: '/media',
  newsletter: '/newsletter'
} as const;
