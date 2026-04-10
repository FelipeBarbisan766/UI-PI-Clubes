import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'
import { take } from 'rxjs';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .login(this.form.getRawValue())
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.authService
            .getMe()
            .pipe(take(1))
            .subscribe({
              next: () => {
                this.isSubmitting.set(false);
                void this.router.navigateByUrl('/select');
              },
              error: () => {
                this.isSubmitting.set(false);
                this.errorMessage.set('Login realizado, mas não foi possível carregar seu perfil.');
              },
            });
        },
        error: (error: unknown) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(error instanceof Error ? error.message : 'Erro ao realizar login.');
        },
      });
  }
}
