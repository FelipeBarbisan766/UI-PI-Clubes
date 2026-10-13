import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth-service';

type Step = 'form' | 'confirm';

@Component({
  selector: 'app-change-email-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './change-email-modal.html',
})
export class ChangeEmailModal {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  /** E-mail atual do usuário (usado para impedir "trocar" pelo mesmo e-mail). */
  readonly currentEmail = input<string>('');

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');
  private readonly confirmHeading = viewChild<ElementRef<HTMLElement>>('confirmHeading');

  readonly step = signal<Step>('form');
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly pendingEmail = signal('');

  readonly form = this.fb.group({
    password: ['', [Validators.required]],
    newEmail: [
      '',
      [
        Validators.required,
        Validators.email,
        (control: AbstractControl): ValidationErrors | null =>
          this.isSameAsCurrent(control.value) ? { sameEmail: true } : null,
      ],
    ],
  });

  // ── API pública (usada via template ref: #emailModal / emailModal.open()) ──

  open(): void {
    this.resetState();
    this.dialogRef().nativeElement.showModal();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  // ── Eventos do <dialog> ────────────────────────────────────────────────────

  /** Esc: não deixa fechar enquanto a requisição está em andamento. */
  protected onCancel(event: Event): void {
    if (this.isSubmitting()) event.preventDefault();
  }

  /** Disparado em qualquer fechamento (botão, Esc, backdrop) — limpa o estado. */
  protected onClosed(): void {
    this.resetState();
  }

  // ── Fluxo ──────────────────────────────────────────────────────────────────

  protected goToConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.pendingEmail.set(this.form.controls.newEmail.value.trim());
    this.error.set(null);
    this.step.set('confirm');
    this.focusAfterRender(this.confirmHeading);
  }

  protected backToForm(): void {
    if (this.isSubmitting()) return;
    this.step.set('form');
    this.focusAfterRender(this.passwordInput);
  }

  protected confirm(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    this.authService
      .changeEmail({
        password: this.form.controls.password.value,
        newEmail: this.pendingEmail(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          // AuthService.changeEmail já limpou a sessão local.
          this.close();
          void this.router.navigate(['/verify-mail'], {
            queryParams: { reason: 'email-change' },
          });
        },
        error: (err: unknown) => {
          this.error.set(
            err instanceof Error ? err.message : 'Não foi possível alterar o e-mail.',
          );
          this.step.set('form');
          this.focusAfterRender(this.passwordInput);
        },
      });
  }

  protected fieldInvalid(field: 'password' | 'newEmail'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && ctrl.touched;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private isSameAsCurrent(value: string | null): boolean {
    const next = (value ?? '').trim().toLowerCase();
    const current = this.currentEmail().trim().toLowerCase();
    return next.length > 0 && next === current;
  }

  private resetState(): void {
    this.form.reset({ password: '', newEmail: '' });
    this.step.set('form');
    this.error.set(null);
    this.pendingEmail.set('');
  }

  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => target()?.nativeElement.focus(), { injector: this.injector });
  }
}
