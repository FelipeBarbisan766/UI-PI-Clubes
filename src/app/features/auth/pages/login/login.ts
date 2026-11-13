import {
  Component,
  inject,
  signal,
  AfterViewInit,
  OnDestroy,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, switchMap, take, tap } from 'rxjs';
import { AuthService, GoogleAccountNotFoundError } from '../../../../core/services/auth-service';
import { GoogleAuthService } from '../../services/service-google';
import { EmailDirective } from '../../../../shared/directives/email-directive';
import { ServiceSignUp } from '../../services/service-sign-up';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, EmailDirective],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements AfterViewInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly signUpService = inject(ServiceSignUp);

  readonly googleBtnRef = viewChild<ElementRef<HTMLElement>>('googleBtn');

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);
  readonly showCreateAccountModal = signal(false);
  readonly isCreatingAccount = signal(false);
  private pendingGoogleToken: string | null = null;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  ngAfterViewInit(): void {
    const btnEl = this.googleBtnRef()?.nativeElement;
    if (!btnEl) return;

    this.googleAuth.initialize((idToken) => {
      this.handleGoogleLogin(idToken);
    });

    this.googleAuth.renderLoginButton(btnEl);
  }

  ngOnDestroy(): void {
    // this.googleAuth.cancel();
  }

  private handleGoogleLogin(idToken: string): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .googleLogin(idToken)
      .pipe(
        take(1),
        switchMap(() => this.authService.refreshMe()),
        tap(() => this.navigateAfterLogin()),
        catchError((error: unknown) => {
          if (error instanceof GoogleAccountNotFoundError) {
            this.pendingGoogleToken = idToken;
            this.showCreateAccountModal.set(true);
            return EMPTY;
          }
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Erro ao entrar com Google.',
          );
          return EMPTY;
        }),
        tap(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        complete: () => this.isSubmitting.set(false),
      });
  }
  confirmCreateGoogleAccount(): void {
    const idToken = this.pendingGoogleToken;
    if (!idToken || this.isCreatingAccount()) return;

    this.isCreatingAccount.set(true);
    this.errorMessage.set('');

    this.signUpService
      .signUpWithGoogle({ idToken })
      .pipe(
        take(1),
        switchMap(() => this.authService.googleLogin(idToken)),
        switchMap(() => this.authService.refreshMe()),
        tap(() => {
          this.closeCreateAccountModal();
          this.navigateAfterLogin();
        }),
        catchError((error: unknown) => {
          this.closeCreateAccountModal();
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Erro ao criar conta com Google.',
          );
          return EMPTY;
        }),
        finalize(() => this.isCreatingAccount.set(false)),
      )
      .subscribe();
  }

  closeCreateAccountModal(): void {
    this.showCreateAccountModal.set(false);
    this.pendingGoogleToken = null;
  }
  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .login(this.form.getRawValue())
      .pipe(
        take(1),
        switchMap(() => this.authService.refreshMe()),
        tap(() => this.navigateAfterLogin()),
        catchError((error: unknown) => {
          this.errorMessage.set(error instanceof Error ? error.message : 'Erro ao realizar login.');
          return EMPTY;
        }),
        tap(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        complete: () => this.isSubmitting.set(false),
      });
  }
  private resolveReturnUrl(): string | null {
    const raw = this.route.snapshot.queryParamMap.get('returnUrl');
    if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
    if (raw.startsWith('/login')) return null; 
    return raw;
  }

  private navigateAfterLogin(): void {
    const defaultRoute = this.authService.getPostLoginRoute();
    const returnUrl = this.resolveReturnUrl();
    const target = returnUrl && defaultRoute !== '/complete-profile' ? returnUrl : defaultRoute;
    void this.router.navigateByUrl(target);
  }
}
