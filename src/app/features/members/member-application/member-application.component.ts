import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { NotificationService } from '../../../core/services/notification.service';

interface SectorOption { value: string; label: string; }

interface MemberApplicationSubmissionResponse {
  data?: {
    emailSent?: boolean;
  };
}

@Component({
  selector: 'app-member-application',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './member-application.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberApplicationComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  currentStep = 1;
  submitting = false;
  emailSent: boolean | null = null;

  steps = [
    { id: 1, label: 'Entreprise' },
    { id: 2, label: 'Coordonnées' },
    { id: 3, label: 'Représentant' },
    { id: 4, label: 'Consentement' },
    { id: 5, label: 'Récapitulatif' },
    { id: 6, label: 'Confirmation' }
  ];

  // Step 1
  companyName = '';
  legalForm = '';
  description = '';
  website = '';
  email = '';
  phone = '';
  address = '';
  logoUrl = '';
  sectors: string[] = [];
  employees: number | null = null;

  // Step 2
  representativeName = '';
  representativeLastName = '';
  representativeEmail = '';

  // Step 3
  consent = false;

  sectorOptions: SectorOption[] = [
    { value: 'FinTech', label: 'FinTech' },
    { value: 'EdTech', label: 'EdTech' },
    { value: 'HealthTech', label: 'HealthTech' },
    { value: 'AgriTech', label: 'AgriTech' },
    { value: 'GreenTech', label: 'GreenTech' },
    { value: 'CyberSecurity', label: 'CyberSecurite' },
    { value: 'AI', label: 'Intelligence Artificielle' },
    { value: 'IoT', label: 'IoT / Objets connectes' },
    { value: 'Blockchain', label: 'Blockchain' },
    { value: 'Autre', label: 'Autre' }
  ];

  legalFormOptions = ['SARL', 'SA', 'SAS', 'EURL', 'Auto-entrepreneur', 'Association', 'Autre'];

  nextStep(): void {
    if (this.currentStep === 1 && !this.validateStep1()) return;
    if (this.currentStep === 2 && !this.validateStep2()) return;
    if (this.currentStep === 3 && !this.validateRepresentative()) return;
    if (this.currentStep === 4 && !this.consent) {
      this.notification.error('Le consentement est obligatoire');
      return;
    }
    if (this.currentStep === 5) {
      this.submit();
      return;
    }
    this.currentStep++;
    this.cdr.markForCheck();
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdr.markForCheck();
    }
  }

  toggleSector(sector: string): void {
    const idx = this.sectors.indexOf(sector);
    if (idx === -1) this.sectors.push(sector);
    else this.sectors.splice(idx, 1);
  }

  submit(): void {
    this.submitting = true;
    this.cdr.markForCheck();

    const payload = {
      companyName: this.companyName,
      legalForm: this.legalForm,
      description: this.description,
      website: this.website || undefined,
      email: this.email || undefined,
      phone: this.phone || undefined,
      address: this.address,
      logoUrl: this.logoUrl || undefined,
      sectors: this.sectors,
      employees: this.employees || undefined,
      representativeName: `${this.representativeName} ${this.representativeLastName}`.trim(),
      representativeEmail: this.representativeEmail,
      consent: this.consent
    };

    this.api.post<MemberApplicationSubmissionResponse>(API_ROUTES.public.memberApplications, payload).subscribe({
      next: (response) => {
        this.submitting = false;
        this.emailSent = response.data?.emailSent ?? null;
        if (this.emailSent === false) {
          this.notification.error("Votre demande est reçue, mais l'email de confirmation n'a pas pu être envoyé.");
        }
        this.currentStep = 6;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message ?? 'Erreur lors de la soumission. Veuillez reessayer.';
        this.notification.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  restart(): void {
    this.currentStep = 1;
    this.submitting = false;
    this.emailSent = null;
    this.companyName = this.legalForm = this.description = this.website = '';
    this.email = this.phone = this.address = this.logoUrl = '';
    this.sectors = [];
    this.employees = null;
    this.representativeName = this.representativeLastName = this.representativeEmail = '';
    this.consent = false;
    this.cdr.markForCheck();
  }

  private validateStep1(): boolean {
    if (!this.companyName.trim() || !this.legalForm || !this.description.trim() || !this.address.trim()) {
      this.notification.error('Veuillez remplir tous les champs obligatoires (nom, forme juridique, description, adresse)');
      return false;
    }
    return true;
  }

  private validateStep2(): boolean {
    const email = this.email.trim();
    if (!email) {
      this.notification.error("L'email de l'entreprise est obligatoire");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.notification.error("Adresse email de l'entreprise invalide");
      return false;
    }
    this.email = email;
    return true;
  }

  private validateRepresentative(): boolean {
    if (!this.representativeName.trim() || !this.representativeLastName.trim() || !this.representativeEmail.trim()) {
      this.notification.error('Prenom, nom et email du representant sont obligatoires');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.representativeEmail)) {
      this.notification.error('Adresse email invalide');
      return false;
    }
    return true;
  }
}
