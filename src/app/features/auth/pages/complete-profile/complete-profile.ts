import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { NgxMaskDirective } from 'ngx-mask';
import { ServiceSignUp } from '../../services/service-sign-up';
import { ToastAlert } from '../../../../shared/components/toast-alert/toast-alert';
import { AuthService } from '../../../../core/services/auth-service';
import { cpfValidator, notFutureDateValidator } from '../../../../shared/validators/cpf.validator';

@Component({
  selector: 'app-complete-profile',
  imports: [ReactiveFormsModule, NgxMaskDirective, ToastAlert],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompleteProfile {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly signUpService = inject(ServiceSignUp);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    phoneNumber: ['', [Validators.required]],
    cpf: ['', [Validators.required, cpfValidator()]],
    birthDate: ['', [Validators.required, notFutureDateValidator()]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.signUpService
      .completeProfile(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          this.authService
            .refreshMe()
            .pipe(take(1))
            .subscribe({
              next: () => void this.router.navigateByUrl('/clubs'),
            });
        },
        error: (error: unknown) => this.errorMessage.set(this.extractErrorMessage(error)),
      });
  }
  
  dismiss(): void {
    this.router.navigateByUrl('/clubs')
  }

  private extractErrorMessage(error: unknown): string {
    const fallback =
      'Ocorreu um erro ao completar seu perfil. Verifique os dados e tente novamente.';

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      return (error as { message: string }).message || fallback;
    }

    return fallback;
  }
}
