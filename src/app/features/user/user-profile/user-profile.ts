import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth-service';
import { UpdateProfileDTO, UserProfileService } from '../services/service-user';
import { NgxMaskDirective } from 'ngx-mask';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule,NgxMaskDirective, NgOptimizedImage],
  templateUrl: './user-profile.html',
})
export class UserProfile implements OnInit {
  private readonly profileService = inject(UserProfileService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.profileService.user;
  readonly loading = this.profileService.loading;
  readonly error = this.profileService.error;

  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  });

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: this.fb.control({ value: '', disabled: true }),
    phoneNumber: [''],
  });

  // Expose controls for clean template access
  readonly nameControl = this.form.controls.name;

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);

  ngOnInit(): void {
    const userId = this.authService.me()?.id;
    if (!userId) return;

    this.profileService
      .getById(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        user.avatarUrl; 
        this.form.patchValue({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber ?? '',
        });
        this.form.markAsPristine();
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    const userId = this.authService.me()?.id;
    if (!userId) return;

    const { name, phoneNumber } = this.form.getRawValue();
    const dto: UpdateProfileDTO = { name, phoneNumber };

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.submitError.set(null);

    this.profileService
      .update(userId, dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Perfil atualizado com sucesso!');
          this.form.markAsPristine();
        },
        error: () =>
          this.submitError.set(
            this.profileService.error() ?? 'Erro ao salvar as alterações.'
          ),
      });
  }

  onReset(): void {
    const user = this.user();
    if (!user) return;

    this.form.patchValue({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber ?? '',
    });
    this.form.markAsPristine();
    this.successMessage.set(null);
    this.submitError.set(null);
  }
}