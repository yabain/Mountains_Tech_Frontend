import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger
} from '@angular/animations';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  animations: [
    trigger('footerReveal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(14px)' }),
        animate('650ms 80ms cubic-bezier(0.22, 1, 0.36, 1)', style({
          opacity: 1,
          transform: 'translateY(0)'
        })),
        query('.footer__main > section', [
          style({ opacity: 0, transform: 'translateY(18px)' }),
          stagger(90, animate('500ms cubic-bezier(0.22, 1, 0.36, 1)', style({
            opacity: 1,
            transform: 'translateY(0)'
          })))
        ], { optional: true }),
        query('.footer__bottom', [
          style({ opacity: 0 }),
          animate('450ms ease-out', style({ opacity: 1 }))
        ], { optional: true })
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {}
