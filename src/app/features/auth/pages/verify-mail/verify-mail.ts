import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { ServiceVerifymail } from '../../services/service-verifymail';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';


@Component({
  selector: 'app-verify-mail',
  imports: [ReactiveFormsModule],
  templateUrl: './verify-mail.html',
  styleUrl: './verify-mail.css',
})
export class VerifyMail {
  private router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly verifyMailService = inject(ServiceVerifymail);
  private readonly fb = inject(FormBuilder);

  readonly status = signal('pending');
  readonly successMessage = signal('E-mail verificado com sucesso.');
  readonly errorMessage = signal('Não foi possível verificar seu e-mail.');

  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status.set('pending');
      return;
    }

    this.status.set('loading');

    this.verifyMailService
      .verifyEmail(token)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.status.set('success');
          this.successMessage.set(result.message);
        },
        error: (error: unknown) => {
          this.status.set('error');
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Link inválido ou expirado.',
          );
        },
      });
  }
  requestResendEmail() {
    this.status.set('InputResendEmail');
  }

  resendVerificationEmail() {
      console.log('Resend verification email requested.');
      if (this.emailForm.invalid) {
        this.emailForm.markAllAsTouched();
        return;

      }
      console.log('Requesting password reset for:', this.emailForm.get('email')!.value);
      const email = this.emailForm.get('email')!.value!;
      if (email) {
        this.status.set('loading');
        this.verifyMailService
          .resendVerificationEmail(email)
          .pipe(take(1))
          .subscribe({
            next: (result) => {
              this.status.set('resendSuccess');
              this.successMessage.set(result.message);
            },
            error: (error: unknown) => {
              this.status.set('error');
              this.errorMessage.set(
                error instanceof Error
                  ? error.message
                  : 'Não foi possível reenviar o e-mail de verificação.',
              );
            },
          });
      } else {
        console.log('Email is null or undefined. Cannot resend verification email.');
      }
    }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
