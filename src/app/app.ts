import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';import { AuthService } from './core/services/auth-service';
;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angularteste');

  private readonly authService = inject(AuthService);

  constructor() {
    this.authService.resolveSession().subscribe();
  }
}
