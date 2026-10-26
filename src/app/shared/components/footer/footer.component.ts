import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  animations: [
    trigger('footerReveal', [
      state('hidden, visible', style({})),
      transition('hidden => visible', [
        query(
          'h2:not(.visually-hidden), p, a',
          [
            style({ opacity: 0, transform: 'translateY(18px)' }),
            stagger('65ms', [
              animate(
                '420ms cubic-bezier(0.2, 0.65, 0.3, 1)',
                style({ opacity: 1, transform: 'translateY(0)' })
              )
            ])
          ],
          { optional: true }
        )
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnDestroy {
  footerVisible = false;
  readonly prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private footerObserver?: IntersectionObserver;

  @ViewChild('footerElement')
  set footerElement(element: ElementRef<HTMLElement> | undefined) {
    this.footerObserver?.disconnect();
    if (!element) {
      return;
    }

    if (this.prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      this.footerVisible = true;
      return;
    }

    this.footerObserver = new IntersectionObserver((entries, observer) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        this.footerVisible = true;
        observer.disconnect();
        this.changeDetectorRef.markForCheck();
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    this.footerObserver.observe(element.nativeElement);
  }

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.footerObserver?.disconnect();
  }
}
