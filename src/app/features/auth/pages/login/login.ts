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
import { Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, switchMap, take, tap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth-service';
import { GoogleAuthService } from '../../services/service-google';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements AfterViewInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly router = inject(Router);

  readonly googleBtnRef = viewChild<ElementRef<HTMLElement>>('googleBtn');

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngAfterViewInit(): void {
    const btnEl = this.googleBtnRef()?.nativeElement;
    if (!btnEl) return;

    this.googleAuth.initialize((idToken) => {
      this.handleGoogleLogin(idToken);
    });

    this.googleAuth.renderLoginButton(btnEl);
  }

  ngOnDestroy(): void {
    this.googleAuth.cancel();
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
        tap(() => void this.router.navigateByUrl('/clubs')),
        catchError((error: unknown) => {
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Erro ao entrar com Google.'
          );
          return EMPTY;
        }),
        tap(() => this.isSubmitting.set(false))
      )
      .subscribe({
        complete: () => this.isSubmitting.set(false),
      });
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
        tap(() => void this.router.navigateByUrl('/clubs')),
        catchError((error: unknown) => {
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Erro ao realizar login.'
          );
          return EMPTY;
        }),
        tap(() => this.isSubmitting.set(false))
      )
      .subscribe({
        complete: () => this.isSubmitting.set(false),
      });
  }
}