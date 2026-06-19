import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ThemeService } from './theme-service';

interface ThemeColor {
  name: string;
  value: string;
}

@Component({
  selector: 'app-themeselector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './themeselector.html',
})
export class Themeselector {
  private readonly themeService = inject(ThemeService);

  readonly colors: ThemeColor[] = [
    { name: 'Vermelho', value: 'oklch(72.3% 0.370 16.823)' },
    { name: 'Laranja', value: 'oklch(65.93% 0.230 35.22)' },
    { name: 'Azul', value: 'oklch(52.15% 0.123 250)' },
    { name: 'Laranja 2', value: 'oklch(72.19% 0.215 50)' },
    { name: 'Verde', value: 'oklch(52% 0.154 150.069)' },
  ];

  readonly selectedColor = this.themeService.selectedColor;

  onColorSelect(newColorValue: string): void {
    this.themeService.setColor(newColorValue);
  }
}