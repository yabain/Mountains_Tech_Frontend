import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() prevPageClick = new EventEmitter<void>();
  @Output() nextPageClick = new EventEmitter<void>();

  onPageSizeChange(value: string): void {
    this.pageSizeChange.emit(Number(value));
  }

  prevPage(): void {
    this.prevPageClick.emit();
  }

  nextPage(): void {
    this.nextPageClick.emit();
  }
}