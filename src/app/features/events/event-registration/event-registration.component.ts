import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { NotificationService } from '../../../core/services/notification.service';

interface EventData {
  id: string;
  title: string;
  startAt: string;
  endAt?: string;
  location?: string;
  coverUrl?: string;
  registrationRequired: boolean;
  capacity?: number;
}

@Component({
  selector: 'app-event-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './event-registration.component.html',
})
export class EventRegistrationComponent implements OnInit {
  eventId = '';
  event: EventData | null = null;
  loadingEvent = true;
  eventLoadError = '';
  submitting = false;

  currentStep = 1;
  steps = [
    { id: 1, label: 'Mes infos' },
    { id: 2, label: 'Confirmation' },
    { id: 3, label: 'Reçu' }
  ];

  // Step 1
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  organization = '';

  // Step 2
  consent = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.notification.error('Événement introuvable');
      this.router.navigate(['/events']);
      return;
    }
    this.loadEvent();
  }

  loadEvent(): void {
    this.api.get<{success: boolean, data: EventData}>(`${API_ROUTES.public.events}/${this.eventId}`).subscribe({
      next: (res) => {
        this.event = res.data;
        if (!this.event?.registrationRequired) {
          this.notification.error("Cet événement ne nécessite pas d'inscription");
          this.router.navigate(['/events', this.eventId]);
        }
        this.loadingEvent = false;
      },
      error: () => {
        this.eventLoadError = 'Cet événement est introuvable ou ne peut pas être chargé pour le moment.';
        this.loadingEvent = false;
        this.notification.error('Impossible de charger l\'événement');
      }
    });
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.validateStep1()) return;
    if (this.currentStep === 2 && !this.consent) {
      this.notification.error('Le consentement est obligatoire');
      return;
    }
    if (this.currentStep < this.steps.length) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  private validateStep1(): boolean {
    if (!this.firstName || !this.lastName || !this.email) {
      this.notification.error('Prénom, nom et email sont obligatoires');
      return false;
    }
    return true;
  }

  submit(): void {
    this.submitting = true;
    const payload = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone || null,
      organization: this.organization || null,
      consent: this.consent
    };

    this.api.post<{success: boolean, data: {registrationId: string, status: string}}>(
      adminDynamicRoutes.publicEventRegistrations(this.eventId),
      payload
    ).subscribe({
      next: (res) => {
        this.submitting = false;
        this.notification.success('Inscription confirmée !');
        this.currentStep = 3;
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Erreur lors de l\'inscription';
        this.notification.error(msg);
      }
    });
  }

  goToEvent(): void {
    this.router.navigate(['/events', this.eventId]);
  }

  goToEvents(): void {
    this.router.navigate(['/events']);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}