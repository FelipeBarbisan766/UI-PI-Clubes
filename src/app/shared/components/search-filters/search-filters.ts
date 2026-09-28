import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { ServiceSport } from '../../../core/services/service-sport';
import { TextDirective } from '../../directives/text-directive';

@Component({
  selector: 'app-search-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextDirective],
  templateUrl: './search-filters.html',
})
export class SearchFilters implements OnInit {
  protected readonly sportService = inject(ServiceSport);

  readonly searchTerm = input<string>('');
  readonly searchPlaceholder = input<string>('Pesquisar...');
  readonly cityFilter = input<string>('');
  readonly detectedCity = input<string | null>(null);
  readonly selectedSportIds = input<readonly string[]>([]);

  readonly searchTermChange = output<string>();
  readonly cityFilterChange = output<string>();
  readonly clearDetectedCity = output<void>();
  readonly toggleSport = output<string>();
  readonly clearSports = output<void>();

  ngOnInit(): void {
    this.sportService.getAll().subscribe();
  }

  protected onSearchInput(event: Event): void {
    this.searchTermChange.emit((event.target as HTMLInputElement).value);
  }

  protected onCityInput(event: Event): void {
    this.cityFilterChange.emit((event.target as HTMLInputElement).value);
  }

  protected isSportSelected(id: string): boolean {
    return this.selectedSportIds().includes(id);
  }
}