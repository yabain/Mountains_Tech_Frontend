import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { AdminGuard } from './core/auth/guards/admin.guard';
import { AdminPermissionGuard } from './core/auth/guards/admin-permission.guard';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent) },
      { path: 'about', loadComponent: () => import('./features/about/about.component').then((m) => m.AboutComponent) },
      { path: 'members', loadComponent: () => import('./features/members/member-list/member-list.component').then((m) => m.MemberListComponent) },
      { path: 'members/apply', loadComponent: () => import('./features/members/member-application/member-application.component').then((m) => m.MemberApplicationComponent) },
      { path: 'members/:id', loadComponent: () => import('./features/members/member-detail/member-detail.component').then((m) => m.MemberDetailComponent) },
      { path: 'activities', loadComponent: () => import('./features/activities/activity-list/activity-list.component').then((m) => m.ActivityListComponent) },
      { path: 'activities/:id', loadComponent: () => import('./features/activities/activity-detail/activity-detail.component').then((m) => m.ActivityDetailComponent) },
      { path: 'events', loadComponent: () => import('./features/events/event-list/event-list.component').then((m) => m.EventListComponent) },
      { path: 'events/:id', loadComponent: () => import('./features/events/event-detail/event-detail.component').then((m) => m.EventDetailComponent) },
      { path: 'events/:id/register', loadComponent: () => import('./features/events/event-registration/event-registration.component').then((m) => m.EventRegistrationComponent) },
      { path: 'projects', loadComponent: () => import('./features/projects/project-list/project-list.component').then((m) => m.ProjectListComponent) },
      { path: 'projects/:id', loadComponent: () => import('./features/projects/project-detail/project-detail.component').then((m) => m.ProjectDetailComponent) },
      { path: 'hackathons', loadComponent: () => import('./features/hackathons/hackathon-list/hackathon-list.component').then((m) => m.HackathonListComponent) },
      { path: 'hackathons/:id', loadComponent: () => import('./features/hackathons/hackathon-detail/hackathon-detail.component').then((m) => m.HackathonDetailComponent) },
      { path: 'hackathons/:id/register', loadComponent: () => import('./features/hackathons/team-registration/team-registration.component').then((m) => m.TeamRegistrationComponent) },
      { path: 'partners', loadComponent: () => import('./features/partners/partners.component').then((m) => m.PartnersComponent) },
      { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then((m) => m.ContactComponent) },
      { path: 'newsletter', loadComponent: () => import('./features/newsletter/newsletter-subscription/newsletter-subscription.component').then((m) => m.NewsletterSubscriptionComponent) }
    ]
  },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent) },
  {
    path: 'dashboard',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', data: { permission: 'dashboard' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent) },
      { path: 'users', data: { title: 'Utilisateurs', endpoint: 'users', permission: 'users' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/resource/admin-resource.component').then((m) => m.AdminResourceComponent) },
      { path: 'audit-logs', data: { title: 'Journaux d’audit', endpoint: 'auditLogs', permission: 'audit-logs' }, canActivate: [AdminPermissionGuard], loadComponent: () => import('./features/admin/resource/admin-resource.component').then((m) => m.AdminResourceComponent) },
      ...[
        ['settings', 'Paramètres', 'settings'], ['media', 'Médias', 'media'], ['contacts', 'Contacts', 'contacts'],
        ['members', 'Membres', 'members'], ['projects', 'Projets', 'projects'], ['activities', 'Activités', 'activities'],
        ['events', 'Événements', 'events'], ['hackathons', 'Hackathons', 'hackathons'], ['partners', 'Partenaires', 'partners'],
        ['newsletter', 'Newsletter', 'newsletter'], ['announcements', 'Annonces', 'announcements']
      ].map(([path, title, permission]) => ({
        path,
        data: { title, endpoint: permission === 'newsletter' ? 'newsletter' : permission, permission },
        canActivate: [AdminPermissionGuard],
        loadComponent: () => import('./features/admin/resource/admin-resource.component').then((m) => m.AdminResourceComponent)
      }))
    ]
  },
  { path: 'admin', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
