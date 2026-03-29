import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

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
  private document = inject(DOCUMENT);

  readonly colors: ThemeColor[] = [
    { name: 'Vermelho', value: 'oklch(72.3% 0.370 16.823)' },
    { name: 'Laranja', value: 'oklch(65.93% 0.230 35.22)' },
    { name: 'Azul', value: 'oklch(52.15% 0.123 250)' },
    { name: 'Laranja 2', value: 'oklch(72.19% 0.215 50)' },
    { name: 'Verde', value: 'oklch(52% 0.154 150.069)' }
  ];

  readonly selectedColor = signal<string>(this.colors[0].value);

  onColorSelect(newColorValue: string): void { 
    this.selectedColor.set(newColorValue);
    
    this.document.documentElement.style.setProperty('--color-primary', newColorValue);

    if (this.document.activeElement instanceof HTMLElement) {
      this.document.activeElement.blur();
    }
  }
}