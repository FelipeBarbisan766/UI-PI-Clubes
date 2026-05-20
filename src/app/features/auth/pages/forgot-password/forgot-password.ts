import { Component, OnInit, computed, inject, signal,  ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { take } from 'rxjs';
import { ServiceForgotPassword } from '../../services/service-forgotpassword';

type ForgotPasswordStep =
  | 'request-email'
  | 'email-sent'
  | 'reset-password'
  | 'reset-success'
  | 'reset-error';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (!password || !confirm) return null;
  return password.value !== confirm.value ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush , 
})
export class ForgotPassword implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly forgotPasswordService = inject(ServiceForgotPassword);

  readonly step = signal<ForgotPasswordStep>('request-email');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  private token = '';

  readonly emailError = computed(() => {
    const ctrl = this.emailForm.get('email');
    if (!ctrl?.invalid || !ctrl.touched) return '';
    if (ctrl.errors?.['required']) return 'E-mail é obrigatório.';
    if (ctrl.errors?.['email']) return 'Informe um e-mail válido.';
    return '';
  });

  readonly passwordError = computed(() => {
    const ctrl = this.resetForm.get('password');
    if (!ctrl?.invalid || !ctrl.touched) return '';
    if (ctrl.errors?.['required']) return 'Senha é obrigatória.';
    if (ctrl.errors?.['minlength']) return 'A senha deve ter no mínimo 8 caracteres.';
    return '';
  });

  readonly confirmPasswordError = computed(() => {
    const ctrl = this.resetForm.get('confirmPassword');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Confirmação de senha é obrigatória.';
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
    console.log('Requesting password reset for:', this.emailForm.get('email')!.value);
    const email = this.emailForm.get('email')!.value!;
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.forgotPasswordService
      .requestResetPassword(email)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          console.log('Password reset request successful:', result);
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
    this.errorMessage.set('');

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

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  retryRequest(): void {
    this.step.set('request-email');
    this.errorMessage.set('');
    this.resetForm.reset();
  }
}