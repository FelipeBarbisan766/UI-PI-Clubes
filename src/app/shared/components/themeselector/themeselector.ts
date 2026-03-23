import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

interface ThemeColor {
  name: string;
  value: string;
}

@Component({
  selector: 'app-themeselector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dropdown dropdown-end flex-none ml-4">
      
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle text-white" aria-label="Seletor de tema">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
      </div>

      
      <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-sm mt-2">
        @for (color of colors; track color.name) {
          <li>
            <button 
              (click)="onColorSelect(color.value)"
              [class.active]="selectedColor() === color.value"
              class="flex items-center gap-3"
              [attr.aria-label]="'Selecionar tema ' + color.name"
            >
              
              <span 
                class="w-4 h-4 rounded-full border border-base-content/20 shadow-sm" 
                [style.background-color]="color.value"
              ></span>
              {{ color.name }}
            </button>
          </li>
        }
      </ul>
    </div>
  `
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