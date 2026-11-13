import { Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { ServiceForgotPassword } from '../../services/service-forgotpassword';
import { AuthService } from '../../../../core/services/auth-service';
import { EmailDirective } from '../../../../shared/directives/email-directive';
import { ToastAlert } from '../../../../shared/components/toast-alert/toast-alert';

type ForgotPasswordStep =
  | 'request-email'
  | 'email-sent'
  | 'reset-password'
  | 'reset-success'
  | 'reset-error';

// Mesma regra do cadastro (sign-up)
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (!password || !confirm) return null;
  return password.value !== confirm.value ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, EmailDirective, ToastAlert],
  templateUrl: './forgot-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly forgotPasswordService = inject(ServiceForgotPassword);

  readonly step = signal<ForgotPasswordStep>('request-email');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  // ATENÇÃO: ajuste para o signal/método real de "usuário logado" do seu AuthService.
  readonly isLoggedIn = computed(() => this.authService.isAuthenticated());

  readonly backLabel = computed(() => (this.isLoggedIn() ? 'Voltar' : 'Voltar para login'));
  readonly finishLabel = computed(() => (this.isLoggedIn() ? 'Continuar' : 'Ir para login'));

  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  private readonly emailFormEvents = toSignal(this.emailForm.events);
  private readonly resetFormEvents = toSignal(this.resetForm.events);

  private token = '';

  readonly emailError = computed(() => {
    this.emailFormEvents();
    const ctrl = this.emailForm.get('email');
    if (!ctrl?.invalid || !ctrl.touched) return '';
    if (ctrl.errors?.['required']) return 'O e-mail é obrigatório.';
    if (ctrl.errors?.['email']) return 'Informe um e-mail válido.';
    return '';
  });

  readonly passwordError = computed(() => {
    this.resetFormEvents();
    const ctrl = this.resetForm.get('password');
    if (!ctrl?.invalid || !ctrl.touched) return '';
    if (ctrl.errors?.['required']) return 'A senha é obrigatória.';
    if (ctrl.errors?.['pattern'])
      return 'A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.';
    return '';
  });

  readonly confirmPasswordError = computed(() => {
    this.resetFormEvents();
    const ctrl = this.resetForm.get('confirmPassword');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'A confirmação de senha é obrigatória.';
    if (this.resetForm.errors?.['passwordMismatch']) return 'As senhas não coincidem.';
    return '';
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(take(1)).subscribe((params) => {
      const token = params.get('token');
      if (token) {
        this.token = token;
        this.step.set('reset-password');
      }
    });
  }

  submitEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.get('email')!.value!;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.forgotPasswordService
      .requestResetPassword(email)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.isLoading.set(false);
          this.successMessage.set(result.message);
          this.step.set('email-sent');
        },
        error: (err: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message);
        },
      });
  }

  submitNewPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const password = this.resetForm.get('password')!.value!;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.forgotPasswordService
      .resetPassword(this.token, password)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.isLoading.set(false);
          this.successMessage.set(result.message);
          this.step.set('reset-success');
        },
        error: (err: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message);
          this.step.set('reset-error');
        },
      });
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  /** Botão "voltar": deslogado -> login; logado -> tela de onde veio (configurações). */
  goBack(): void {
    if (!this.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }
    // Veio pelo link do e-mail: não há "tela anterior" do app para voltar.
    if (this.token) {
      void this.router.navigateByUrl(this.authService.getPostLoginRoute());
      return;
    }
    this.location.back();
  }

  /** Fim do fluxo (senha redefinida): logado não pode ir ao login (guard redireciona). */
  finish(): void {
    if (this.isLoggedIn()) {
      void this.router.navigateByUrl(this.authService.getPostLoginRoute());
      return;
    }
    void this.router.navigate(['/login']);
  }

  retryRequest(): void {
    this.step.set('request-email');
    this.errorMessage.set(null);
    this.resetForm.reset();
  }
}