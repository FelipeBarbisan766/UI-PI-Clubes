import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  AfterViewInit,
  viewChild,
  ElementRef,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, switchMap, take, tap } from 'rxjs';
import { ServiceSignUp } from '../../services/service-sign-up';
import { ToastAlert } from '../../../../shared/components/toast-alert/toast-alert';
import { GoogleAuthService } from '../../services/service-google';
import { AuthService } from '../../../../core/services/auth-service';

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
export class SignUp implements AfterViewInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly signUpService = inject(ServiceSignUp);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly googleBtnRef = viewChild<ElementRef<HTMLElement>>('googleBtn');

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
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  ngAfterViewInit(): void {
    const btnEl = this.googleBtnRef()?.nativeElement;
    if (!btnEl) return;

    this.googleAuth.initialize((idToken) => this.handleGoogleSignUp(idToken));
    this.googleAuth.renderButton(btnEl);

    this.destroyRef.onDestroy(() => this.googleAuth.cancel());
  }

  private handleGoogleSignUp(idToken: string): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    console.log('Google ID Token:', idToken);
    this.signUpService
      .signUpWithGoogle({ idToken })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () =>
          this.authService
            .googleLogin(idToken)
            .pipe(
              take(1),
              switchMap(() => this.authService.refreshMe()),
              tap(() => void this.router.navigateByUrl('/select')),
              catchError((error: unknown) => {
                this.errorMessage.set(
                  error instanceof Error ? error.message : 'Erro ao entrar com Google.',
                );
                return EMPTY;
              }),
              tap(() => this.isSubmitting.set(false)),
            )
            .subscribe({
              complete: () => this.isSubmitting.set(false),
            }),
        error: (error: unknown) => {
          console.log('Google Sign-Up Error:', error);
          this.errorMessage.set(
            'Ocorreu um erro ao criar sua conta com o Google. Tente novamente.',
          );
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { confirmPassword: _, ...payload } = this.form.getRawValue();

    this.signUpService
      .signUp(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigate(['/verify-mail']),
        error: (error: unknown) => this.errorMessage.set(this.extractErrorMessage(error)),
      });
  }

  private extractErrorMessage(error: unknown): string {
    const fallback = 'Ocorreu um erro ao criar sua conta. Verifique os dados e tente novamente.';

    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: string } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message || fallback;
    }

    return fallback;
  }
}
