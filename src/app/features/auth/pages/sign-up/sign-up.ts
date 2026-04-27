import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ServiceSignUp } from '../../services/service-sign-up';
import { ToastAlert } from '../../../../shared/components/toast-alert/toast-alert';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value ?? '';
  const confirmPassword = control.get('confirmPassword')?.value ?? '';
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, ToastAlert],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUp {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly signUpService = inject(ServiceSignUp);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)],
      ],
      password: ['', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
    ]],
    confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { confirmPassword, ...payload } = this.form.getRawValue();

    this.signUpService.signUp(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set(null);
        void this.router.navigate(['/verify-mail']);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);

        const fallback = 'Ocorreu um erro ao criar sua conta. Verifique os dados e tente novamente.';
        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as { error?: { message?: string } }).error?.message === 'string'
            ? (error as { error: { message: string } }).error.message
            : fallback;

        this.errorMessage.set(message || fallback);
      },
    });
  }
}