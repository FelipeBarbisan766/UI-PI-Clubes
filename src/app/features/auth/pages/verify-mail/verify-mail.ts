import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ServiceVerifymail } from '../../services/service-verifymail';
import { AuthService } from '../../../../core/services/auth-service';
import { EmailDirective } from '../../../../shared/directives/email-directive';

type VerifyMailStatus =
  | 'pending'
  | 'loading'
  | 'success'
  | 'error'
  | 'input-resend-email'
  | 'resending'
  | 'resend-success';

@Component({
  selector: 'app-verify-mail',
  imports: [ReactiveFormsModule, EmailDirective],
  templateUrl: './verify-mail.html',
  styleUrl: './verify-mail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyMail {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly verifyMailService = inject(ServiceVerifymail);

  readonly isEmailChange = signal(
    this.route.snapshot.queryParamMap.get('reason') === 'email-change',
  );
  readonly status = signal<VerifyMailStatus>('pending');
  readonly successMessage = signal('E-mail verificado com sucesso.');
  readonly errorMessage = signal('Não foi possível verificar seu e-mail.');

  // ATENÇÃO: ajuste para o signal/método real de "usuário logado" do seu AuthService.
  readonly isLoggedIn = computed(() => this.authService.isAuthenticated());
  readonly backLabel = computed(() => (this.isLoggedIn() ? 'Voltar' : 'Voltar para login'));
  readonly finishLabel = computed(() => (this.isLoggedIn() ? 'Continuar' : 'Ir para login'));

  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private readonly emailFormEvents = toSignal(this.emailForm.events);

  readonly emailError = computed(() => {
    this.emailFormEvents(); // dependência reativa: recalcula a cada evento do form
    const ctrl = this.emailForm.controls.email;
    if (!ctrl.invalid || !ctrl.touched) return '';
    if (ctrl.hasError('required')) return 'O e-mail é obrigatório.';
    if (ctrl.hasError('email')) return 'Informe um e-mail válido.';
    return '';
  });

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) return;

    this.status.set('loading');

    this.verifyMailService
      .verifyEmail(token)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.successMessage.set(result.message);
          this.status.set('success');
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Link inválido ou expirado.',
          );
          this.status.set('error');
        },
      });
  }

  requestResendEmail(): void {
    this.status.set('input-resend-email');
  }

  cancelResend(): void {
    this.emailForm.reset();
    this.status.set('pending');
  }

  resendVerificationEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.controls.email.value!;
    this.status.set('resending');

    this.verifyMailService
      .resendVerificationEmail(email)
      .pipe(take(1))
      .subscribe({
        next: () => this.status.set('resend-success'),
        error: (error: unknown) => {
          this.errorMessage.set(
            error instanceof Error
              ? error.message
              : 'Não foi possível reenviar o e-mail de verificação.',
          );
          this.status.set('error');
        },
      });
  }

  /** Deslogado -> login. Logado -> rota pós-login (o guard do login redireciona logados). */
  goBack(): void {
    this.finish();
  }

  finish(): void {
    if (this.isLoggedIn()) {
      void this.router.navigateByUrl(this.authService.getPostLoginRoute());
      return;
    }
    void this.router.navigate(['/login']);
  }
}