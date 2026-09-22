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
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ChangePasswordDTO, ChangePasswordService } from '../../../features/user/services/service-change-password';
import { UserConfigService } from '../../../features/user/services/service-user'; 

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!newPassword || !confirmPassword) return null;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-change-password-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './change-password-modal.html',
})
export class ChangePasswordModal {
  private readonly changePasswordService = inject(ChangePasswordService);
  private readonly userConfigService = inject(UserConfigService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('passwordDialog');

  readonly hasPassword = computed(() => this.userConfigService.user()?.hasPassword ?? true);

  readonly form = this.fb.group(
    {
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/),]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  readonly oldPasswordControl = this.form.controls.oldPassword;
  readonly newPasswordControl = this.form.controls.newPassword;
  readonly confirmPasswordControl = this.form.controls.confirmPassword;

  readonly submitting = signal(false);

  readonly success = output<string>();
  readonly failed = output<string>();

  open(): void {
    this.form.reset();
    this.dialog()?.nativeElement.showModal();
  }

  close(): void {
    this.dialog()?.nativeElement.close();
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;

    const { oldPassword, newPassword } = this.form.getRawValue();
    const dto: ChangePasswordDTO = { password: oldPassword, newPassword };

    this.submitting.set(true);

    this.changePasswordService
      .changePassword(dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: () => {
          this.close();
          this.success.emit('Senha alterada com sucesso!');
        },
        error: () =>
          this.failed.emit('Não foi possível alterar a senha. Verifique a senha atual.'),
      });
  }
}