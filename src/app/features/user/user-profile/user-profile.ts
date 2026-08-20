import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
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
export class UserProfile implements OnInit, OnDestroy {
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

  // Evita que o navegador exiba a foto antiga em cache quando o backend
  // reaproveita a mesma URL/nome de arquivo após a troca de avatar.
  private readonly avatarCacheBuster = signal(Date.now());
  readonly displayAvatarUrl = computed(() => {
    const url = this.user()?.avatarUrl;
    if (!url) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${this.avatarCacheBuster()}`;
  });
  
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: this.fb.control({ value: '', disabled: true }),
    phoneNumber: [''],
  });
  
  // Expose controls for clean template access
  readonly nameControl = this.form.controls.name;
  
  readonly ModalOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);

  private static readonly MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  readonly selectedAvatarFile = signal<File | null>(null);
  readonly avatarPreviewUrl = signal<string | null>(null);
  readonly avatarUploading = signal(false);
  readonly avatarError = signal<string | null>(null);

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
      .update(dto)
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.avatarError.set(null);

    if (!file) {
      this.selectedAvatarFile.set(null);
      this.revokeAvatarPreview();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.avatarError.set('Selecione um arquivo de imagem válido.');
      input.value = '';
      return;
    }

    if (file.size > UserProfile.MAX_AVATAR_SIZE_BYTES) {
      this.avatarError.set('A imagem deve ter no máximo 5MB.');
      input.value = '';
      return;
    }

    this.revokeAvatarPreview();
    this.selectedAvatarFile.set(file);
    this.avatarPreviewUrl.set(URL.createObjectURL(file));
  }

  onEditAvatar(): void {
    const file = this.selectedAvatarFile();
    const userId = this.authService.me()?.id;
    if (!file || !userId || this.avatarUploading()) return;

    this.avatarUploading.set(true);
    this.avatarError.set(null);

    this.profileService
      .updateAvatar(userId, file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.avatarUploading.set(false))
      )
      .subscribe({
        next: () => {
          this.avatarCacheBuster.set(Date.now());
          this.closeModal();
        },
        error: () => this.avatarError.set('Não foi possível atualizar a foto.'),
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

  openModal(): void {
    this.ModalOpen.set(true);
  }

  closeModal(): void {
    this.ModalOpen.set(false);
    this.selectedAvatarFile.set(null);
    this.avatarError.set(null);
    this.revokeAvatarPreview();
  }

  ngOnDestroy(): void {
    this.revokeAvatarPreview();
  }

  private revokeAvatarPreview(): void {
    const current = this.avatarPreviewUrl();
    if (current) {
      URL.revokeObjectURL(current);
    }
    this.avatarPreviewUrl.set(null);
  }
}