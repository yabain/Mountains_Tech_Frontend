import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { adminGuard } from './core/auth/guards/admin.guard';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

import { HomeComponent } from './features/home/home.component';
import { AboutComponent } from './features/about/about.component';
import { MemberListComponent } from './features/members/member-list/member-list.component';
import { MemberDetailComponent } from './features/members/member-detail/member-detail.component';
import { MemberApplicationComponent } from './features/members/member-application/member-application.component';
import { ActivityListComponent } from './features/activities/activity-list/activity-list.component';
import { ActivityDetailComponent } from './features/activities/activity-detail/activity-detail.component';
import { EventListComponent } from './features/events/event-list/event-list.component';
import { EventDetailComponent } from './features/events/event-detail/event-detail.component';
import { EventRegistrationComponent } from './features/events/event-registration/event-registration.component';
import { ProjectListComponent } from './features/projects/project-list/project-list.component';
import { ProjectDetailComponent } from './features/projects/project-detail/project-detail.component';
import { HackathonListComponent } from './features/hackathons/hackathon-list/hackathon-list.component';
import { HackathonDetailComponent } from './features/hackathons/hackathon-detail/hackathon-detail.component';
import { TeamRegistrationComponent } from './features/hackathons/team-registration/team-registration.component';
import { PartnersComponent } from './features/partners/partners.component';
import { ContactComponent } from './features/contact/contact.component';
import { NewsletterSubscriptionComponent } from './features/newsletter/newsletter-subscription/newsletter-subscription.component';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'about', component: AboutComponent },
      { path: 'members', component: MemberListComponent },
      { path: 'members/:id', component: MemberDetailComponent },
      { path: 'members/apply', component: MemberApplicationComponent },
      { path: 'activities', component: ActivityListComponent },
      { path: 'activities/:id', component: ActivityDetailComponent },
      { path: 'events', component: EventListComponent },
      { path: 'events/:id', component: EventDetailComponent },
      { path: 'events/:id/register', component: EventRegistrationComponent },
      { path: 'projects', component: ProjectListComponent },
      { path: 'projects/:id', component: ProjectDetailComponent },
      { path: 'hackathons', component: HackathonListComponent },
      { path: 'hackathons/:id', component: HackathonDetailComponent },
      { path: 'hackathons/:id/register', component: TeamRegistrationComponent },
      { path: 'partners', component: PartnersComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'newsletter', component: NewsletterSubscriptionComponent },
      { path: 'login', component: LoginComponent }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent) },
      { path: 'members', loadComponent: () => import('./features/members/member-list/member-list.component').then((m) => m.MemberListComponent) },
      { path: 'events', loadComponent: () => import('./features/events/event-list/event-list.component').then((m) => m.EventListComponent) },
      { path: 'projects', loadComponent: () => import('./features/projects/project-list/project-list.component').then((m) => m.ProjectListComponent) },
      { path: 'hackathons', loadComponent: () => import('./features/hackathons/hackathon-list/hackathon-list.component').then((m) => m.HackathonListComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
