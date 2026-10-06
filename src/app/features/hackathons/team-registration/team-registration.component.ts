import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { NotificationService } from '../../../core/services/notification.service';

interface HackathonData {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  minTeamSize: number;
  maxTeamSize: number;
  coverUrl?: string;
}

interface TeamMember {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
}

@Component({
  selector: 'app-team-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './team-registration.component.html',
})
export class TeamRegistrationComponent implements OnInit {
  hackathonId = '';
  hackathon: HackathonData | null = null;
  loadingHackathon = true;
  hackathonLoadError = '';
  submitting = false;

  currentStep = 1;
  steps = [
    { id: 1, label: 'Équipe' },
    { id: 2, label: 'Chef d\'équipe' },
    { id: 3, label: 'Membres' },
    { id: 4, label: 'Projet' },
    { id: 5, label: 'Confirmation' },
    { id: 6, label: 'Reçu' }
  ];

  // Step 1 - Équipe
  teamName = '';
  schoolOrOrganization = '';

  // Step 2 - Chef d'équipe
  leader = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  // Step 3 - Membres
  members: TeamMember[] = [];
  newMember: TeamMember = { firstName: '', lastName: '', email: '', phone: '', role: '' };

  // Step 4 - Projet
  projectIdea = '';
  technologyStack: string[] = [];

  // Step 5 - Confirmation
  consent = false;

  techOptions = ['Angular', 'React', 'Vue', 'Node.js', 'NestJS', 'Django', 'Python', 'MongoDB', 'PostgreSQL', 'Firebase', 'AWS', 'Docker', 'Kubernetes', 'TensorFlow', 'Autre'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.hackathonId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.hackathonId) {
      this.notification.error('Hackathon introuvable');
      this.router.navigate(['/hackathons']);
      return;
    }
    this.loadHackathon();
  }

  loadHackathon(): void {
    this.api.get<{success: boolean, data: HackathonData}>(`${API_ROUTES.public.hackathons}/${this.hackathonId}`).subscribe({
      next: (res) => {
        this.hackathon = res.data;
        this.loadingHackathon = false;
      },
      error: () => {
        this.hackathonLoadError = 'Ce hackathon est introuvable ou ne peut pas être chargé pour le moment.';
        this.loadingHackathon = false;
        this.notification.error('Impossible de charger le hackathon');
      }
    });
  }

  // --- Navigation ---
  nextStep(): void {
    if (this.currentStep === 1 && !this.validateStep1()) return;
    if (this.currentStep === 2 && !this.validateStep2()) return;
    if (this.currentStep === 3 && this.members.length > 0 && !this.validateMembers()) return;
    if (this.currentStep === 4 && !this.projectIdea.trim()) {
      this.notification.error('Décrivez votre idée de projet');
      return;
    }
    if (this.currentStep === 5 && !this.consent) {
      this.notification.error('Le consentement est obligatoire');
      return;
    }
    if (this.currentStep < this.steps.length) this.currentStep++;
  }

  prevStep(): void { if (this.currentStep > 1) this.currentStep--; }

  private validateStep1(): boolean {
    if (!this.teamName || !this.schoolOrOrganization) {
      this.notification.error('Nom d\'équipe et établissement obligatoires');
      return false;
    }
    return true;
  }

  private validateStep2(): boolean {
    if (!this.leader.firstName || !this.leader.lastName || !this.leader.email) {
      this.notification.error('Infos chef d\'équipe obligatoires');
      return false;
    }
    return true;
  }

  private validateMembers(): boolean {
    for (const m of this.members) {
      if (!m.firstName || !m.lastName || !m.email) return false;
    }
    return true;
  }

  // --- Membres ---
  addMember(): void {
    if (!this.newMember.firstName || !this.newMember.lastName || !this.newMember.email) {
      this.notification.error('Prénom, nom et email obligatoires');
      return;
    }
    const total = 1 + this.members.length + 1;
    if (this.hackathon && total > this.hackathon.maxTeamSize) {
      this.notification.error(`Taille max équipe : ${this.hackathon.maxTeamSize}`);
      return;
    }
    this.members.push({ ...this.newMember });
    this.newMember = { firstName: '', lastName: '', email: '', phone: '', role: '' };
  }

  removeMember(index: number): void { this.members.splice(index, 1); }

  // --- Technologies ---
  toggleTech(tech: string): void {
    const idx = this.technologyStack.indexOf(tech);
    if (idx === -1) this.technologyStack.push(tech);
    else this.technologyStack.splice(idx, 1);
  }

  // --- Submit ---
  submit(): void {
    this.submitting = true;
    const totalMembers = 1 + this.members.length;
    if (this.hackathon) {
      if (totalMembers < this.hackathon.minTeamSize) { this.notification.error(`Minimum ${this.hackathon.minTeamSize} membres`); this.submitting = false; return; }
      if (totalMembers > this.hackathon.maxTeamSize) { this.notification.error(`Maximum ${this.hackathon.maxTeamSize} membres`); this.submitting = false; return; }
    }

    const payload = {
      teamName: this.teamName,
      schoolOrOrganization: this.schoolOrOrganization,
      leader: this.leader,
      members: this.members,
      projectIdea: this.projectIdea,
      technologyStack: this.technologyStack,
      consent: this.consent
    };

    this.api.post<{success: boolean, data: {teamId: string, status: string}}>(
      adminDynamicRoutes.publicHackathonTeams(this.hackathonId),
      payload
    ).subscribe({
      next: () => { this.submitting = false; this.notification.success('Équipe enregistrée !'); this.currentStep = 6; },
      error: (err) => { this.submitting = false; this.notification.error(err?.error?.message || 'Erreur'); }
    });
  }

  goToHackathon(): void { this.router.navigate(['/hackathons', this.hackathonId]); }
  goToHackathons(): void { this.router.navigate(['/hackathons']); }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  get currentTeamSize(): number { return 1 + this.members.length; }
  get minSize(): number { return this.hackathon?.minTeamSize || 2; }
  get maxSize(): number { return this.hackathon?.maxTeamSize || 5; }
}