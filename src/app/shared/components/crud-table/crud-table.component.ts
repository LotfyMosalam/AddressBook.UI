import { Component, computed, input, output } from '@angular/core';

export interface NamedItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-crud-table',
  standalone: true,
  imports: [],
  templateUrl: './crud-table.component.html',
  styleUrl: './crud-table.component.scss',
})
export class CrudTableComponent {
  readonly title = input.required<string>();
  readonly items = input<NamedItem[]>([]);
  readonly isLoading = input<boolean>(false);
  readonly errorMsg = input<string | null>(null);
  readonly addLabel = input<string>('Add');

  readonly addClicked = output<void>();
  readonly editClicked = output<string>();
  readonly deleteClicked = output<NamedItem>();
  readonly retryClicked = output<void>();

  readonly isEmpty = computed(
    () => !this.isLoading() && !this.errorMsg() && this.items().length === 0,
  );

  readonly skeletonRows = Array(5).fill(0);
}
