import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [RouterLink],
  template: `<main class="error-page" aria-label="Page d'erreur">
    <header class="error-header">
      <a class="brand-mark" routerLink="/dashboard" aria-label="Retour au tableau de bord">
        <i class="bi bi-caret-left" aria-hidden="true"></i>
        <span>Retour</span>
      </a>
    </header>
    <section class="error-body">
      <h1 class="error-title">{{ code() }}</h1>
      <p class="error-desc">{{ description() }}</p>
      <a class="error-cta" routerLink="/dashboard">Retour au tableau de bord</a>
    </section>
  </main>`,
  styleUrl: './error-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPageComponent {
  code = () => '404';
  description = () => 'Cette page n’existe pas ou a été déplacée. Vérifiez l’adresse ou revenez au tableau de bord.';
}
