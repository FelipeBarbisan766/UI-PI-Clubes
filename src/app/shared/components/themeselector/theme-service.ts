// theme.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const THEME_STORAGE_KEY = 'theme-color';
const DEFAULT_COLOR = 'oklch(72.3% 0.370 16.823)'; // Vermelho

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _selectedColor = signal<string>(DEFAULT_COLOR);
  readonly selectedColor = this._selectedColor.asReadonly();

  constructor() {
    this.applyStoredTheme();
  }

  setColor(newColorValue: string): void {
    this._selectedColor.set(newColorValue);
    localStorage.setItem(THEME_STORAGE_KEY, newColorValue);
    this.applyColor(newColorValue);
  }

  private applyStoredTheme(): void {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const colorToApply = stored ?? DEFAULT_COLOR;
    this._selectedColor.set(colorToApply);
    this.applyColor(colorToApply);
  }

  private applyColor(color: string): void {
    this.document.documentElement.style.setProperty('--color-primary', color);
  }
}