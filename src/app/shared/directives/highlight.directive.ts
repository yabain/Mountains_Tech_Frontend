import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {
  @Input('appHighlight') color = 'yellow';

  constructor(
    private readonly elementRef: ElementRef,
    private readonly renderer: Renderer2
  ) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.renderer.setStyle(this.elementRef.nativeElement, 'background-color', this.color);
    this.renderer.setStyle(this.elementRef.nativeElement, 'transition', 'background-color 0.2s ease');
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.renderer.removeStyle(this.elementRef.nativeElement, 'background-color');
  }
}
