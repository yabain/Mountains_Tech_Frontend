import { ChangeDetectionStrategy, Component } from '@angular/core';
import { animate, group, query, sequence, stagger, state, style, transition, trigger } from '@angular/animations';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('pageTransition', [
      state('visible', style({ opacity: 1 })),
      transition(':enter', [
        query(':self', [
          sequence([
            style({ opacity: 0 }),
            group([
              animate('280ms ease-out', style({ opacity: 1 })),
              query(':scope > *', [
                stagger(40, animate('220ms ease-out', style({ opacity: 1 })))
              ], { optional: true })
            ])
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class PublicLayoutComponent {}
