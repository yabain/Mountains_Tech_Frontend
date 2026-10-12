import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { AdminGuard } from './core/auth/guards/admin.guard';
import { AdminPermissionGuard } from './core/auth/guards/admin-permission.guard';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

export const routes: Routes = [
  { path: 'devenir-membre', loadComponent: () => import('./features/members/member-application/member-application.component').then((m) => m.MemberApplicationComponent) },
  { path: 'members/apply', redirectTo: 'devenir-membre' },
  { path: 'evenements/:slug/inscription', loadComponent: () => import('./features/events/event-registration/event-registration.component').then((m) => m.EventRegistrationComponent) },
  { path: 'evenements/:id/register', redirectTo: 'evenements/:slug/inscription' },
  { path: 'events/:id/register', redirectTo: 'evenements/:slug/inscription' },
  { path: 'hackathons/:slug/inscription', loadComponent: () => import('./features/hackathons/team-registration/team-registration.component').then((m) => m.TeamRegistrationComponent) },
  { path: 'hackathons/:id/register', redirectTo: 'hackathons/:slug/inscription' },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent) },
      { path: 'about', loadComponent: () => import('./features/about/about.component').then((m) => m.AboutComponent) },
      { path: 'a-propos', redirectTo: 'about' },
      { path: 'membres', loadComponent: () => import('./features/members/member-list/member-list.component').then((m) => m.MemberListComponent) },
      { path: 'members', redirectTo: 'membres' },
      { path: 'membres/:slug', loadComponent: () => import('./features/members/member-detail/member-detail.component').then((m) => m.MemberDetailComponent) },
      { path: 'members/:id', redirectTo: 'membres/:slug' },
      { path: 'activites', loadComponent: () => import('./features/activities/activity-list/activity-list.component').then((m) => m.ActivityListComponent) },
      { path: 'activities', redirectTo: 'activites' },
      { path: 'activites/:slug', loadComponent: () => import('./features/activities/activity-detail/activity-detail.component').then((m) => m.ActivityDetailComponent) },
      { path: 'activities/:id', redirectTo: 'activites/:slug' },
      { path: 'evenements', loadComponent: () => import('./features/events/event-list/event-list.component').then((m) => m.EventListComponent) },
      { path: 'events', redirectTo: 'evenements' },
      { path: 'evenements/:slug', loadComponent: () => import('./features/events/event-detail/event-detail.component').then((m) => m.EventDetailComponent) },
      { path: 'events/:id', redirectTo: 'evenements/:slug' },
      { path: 'projets', loadComponent: () => import('./features/projects/project-list/project-list.component').then((m) => m.ProjectListComponent) },
      { path: 'projects', redirectTo: 'projets' },
      { path: 'projets/:slug', loadComponent: () => import('./features/projects/project-detail/project-detail.component').then((m) => m.ProjectDetailComponent) },
      { path: 'projects/:id', redirectTo: 'projets/:slug' },
      { path: 'hackathons', loadComponent: () => import('./features/hackathons/hackathon-list/hackathon-list.component').then((m) => m.HackathonListComponent) },
      { path: 'hackathons/:slug', loadComponent: () => import('./features/hackathons/hackathon-detail/hackathon-detail.component').then((m) => m.HackathonDetailComponent) },
      { path: 'hackathons/:id', redirectTo: 'hackathons/:slug' },
      { path: 'partenaires', loadComponent: () => import('./features/partners/partners.component').then((m) => m.PartnersComponent) },
      { path: 'partners', redirectTo: 'partenaires' },
      { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then((m) => m.ContactComponent) },
      { path: 'newsletter', loadComponent: () => import('./features/newsletter/newsletter-subscription/newsletter-subscription.component').then((m) => m.NewsletterSubscriptionComponent) },
      { path: 'mentions-legales', loadComponent: () => import('./features/legal/mentions-legales/mentions-legales.component').then((m) => m.MentionsLegalesComponent) },
      { path: 'politique-confidentialite', loadComponent: () => import('./features/legal/politique-confidentialite/politique-confidentialite.component').then((m) => m.PolitiqueConfidentialiteComponent) }
    ]
  },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent) },
  {
    path: 'dashboard',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', data: { permission: 'dashboard' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent) },
      { path: 'users', data: { title: 'Utilisateurs', endpoint: 'users', permission: 'users' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/users/admin-users.component').then((m) => m.AdminUsersComponent) },
      { path: 'audit-logs', data: { title: "Journaux d'audit", endpoint: 'auditLogs', permission: 'audit-logs' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/audit-logs/admin-audit-logs.component').then((m) => m.AdminAuditLogsComponent) },
      { path: 'members/applications', data: { title: "Demandes d'adhesion", endpoint: 'memberApplications', permission: 'members' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/members/admin-member-applications.component').then((m) => m.AdminMemberApplicationsComponent) },
      { path: 'members', data: { title: 'Membres', endpoint: 'members', permission: 'members' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/members/admin-members.component').then((m) => m.AdminMembersComponent) },
      { path: 'contacts', data: { title: 'Contacts', endpoint: 'contacts', permission: 'contacts' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/contacts/admin-contacts.component').then((m) => m.AdminContactsComponent) },
      { path: 'events', data: { title: 'Evenements', endpoint: 'events', permission: 'events' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/events/admin-events.component').then((m) => m.AdminEventsComponent) },
      { path: 'activities', data: { title: 'Activites', endpoint: 'activities', permission: 'activities' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/activities/admin-activities.component').then((m) => m.AdminActivitiesComponent) },
      { path: 'projects', data: { title: 'Projets', endpoint: 'projects', permission: 'projects' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/projects/admin-projects.component').then((m) => m.AdminProjectsComponent) },
      { path: 'hackathons', data: { title: 'Hackathons', endpoint: 'hackathons', permission: 'hackathons' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/hackathons/admin-hackathons.component').then((m) => m.AdminHackathonsComponent) },
      { path: 'partners', data: { title: 'Partenaires', endpoint: 'partners', permission: 'partners' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/partners/admin-partners.component').then((m) => m.AdminPartnersComponent) },
      { path: 'media', data: { title: 'Medias', endpoint: 'media', permission: 'media' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/media/admin-media.component').then((m) => m.AdminMediaComponent) },
      { path: 'newsletter', data: { title: 'Newsletter', endpoint: 'newsletter', permission: 'newsletter' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/newsletter/admin-newsletter.component').then((m) => m.AdminNewsletterComponent) },
      { path: 'announcements/new', data: { permission: 'announcements' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/announcements/announcement-editor.component').then((m) => m.AnnouncementEditorComponent) },
      { path: 'announcements/:id/edit', data: { permission: 'announcements' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/announcements/announcement-editor.component').then((m) => m.AnnouncementEditorComponent) },
      { path: 'announcements', data: { title: 'Annonces', endpoint: 'announcements', permission: 'announcements' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/resource/admin-resource.component').then((m) => m.AdminResourceComponent) },
      { path: 'settings', data: { title: 'Parametres', endpoint: 'settings', permission: 'settings' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/settings/admin-settings.component').then((m) => m.AdminSettingsComponent) }
    ]
  },
  { path: 'admin', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
