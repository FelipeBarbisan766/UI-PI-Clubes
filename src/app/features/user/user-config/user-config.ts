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
import { UpdateConfigDTO, UserConfigService } from '../services/service-user';
import { NgxMaskDirective } from 'ngx-mask';
import { NgOptimizedImage } from '@angular/common';
import { ToastAlert } from '../../../shared/components/toast-alert/toast-alert';
import { OnlyLetters } from '../../../shared/directives/only-letters';
import { RouterLink } from '@angular/router';
import { ServiceSport } from '../../../core/services/service-sport';

type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-user-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NgxMaskDirective,
    NgOptimizedImage,
    ToastAlert,
    OnlyLetters,
    RouterLink,
  ],
  templateUrl: './user-config.html',
})
export class UserConfig implements OnInit, OnDestroy {
  private readonly configService = inject(UserConfigService);
  private readonly authService = inject(AuthService);
  private readonly sportService = inject(ServiceSport);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.configService.user;
  readonly loading = this.configService.loading;
  readonly error = this.configService.error;

  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  });

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

  readonly nameControl = this.form.controls.name;

  readonly ModalOpen = signal(false);
  readonly isSubmitting = signal(false);

  readonly toast = signal<{ message: string; type: ToastType } | null>(null);

  private static readonly MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  readonly selectedAvatarFile = signal<File | null>(null);
  readonly avatarPreviewUrl = signal<string | null>(null);
  readonly avatarUploading = signal(false);
  readonly avatarError = signal<string | null>(null);

  // ── Esportes favoritos ────────────────────────────────────────────────────
  private playerId: string | null = null;

  readonly favoriteSports = this.configService.favoriteSports;
  readonly availableSports = this.sportService.sports;
  readonly sportsLoading = this.sportService.loading;

  readonly editingFavorites = signal(false);
  readonly selectedFavorites = signal<string[]>([]);
  readonly savingFavorites = signal(false);
  readonly favoritesError = signal<string | null>(null);

  ngOnInit(): void {
    const userId = this.authService.me()?.id;
    if (!userId) return;

    this.configService
      .getById(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        user.avatarUrl;
        this.form.patchValue({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber ?? '',
        });
        this.form.markAsPristine();
      });

    this.sportService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.configService
      .getFavoriteSports()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {},
        error: (err: unknown) => console.error('Erro ao carregar esportes favoritos:', err),
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    const userId = this.authService.me()?.id;
    if (!userId) return;

    const { name, phoneNumber } = this.form.getRawValue();
    const dto: UpdateConfigDTO = { name, phoneNumber };

    this.isSubmitting.set(true);

    this.configService
      .update(dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.toast.set({ message: 'Perfil atualizado com sucesso!', type: 'success' });
        },
        error: () =>
          this.toast.set({
            message: this.configService.error() ?? 'Erro ao salvar as alterações.',
            type: 'error',
          }),
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

    if (file.size > UserConfig.MAX_AVATAR_SIZE_BYTES) {
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

    this.configService
      .updateAvatar(userId, file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.avatarUploading.set(false)),
      )
      .subscribe({
        next: () => {
          this.avatarCacheBuster.set(Date.now());
          this.closeModal();
          this.toast.set({ message: 'Foto de perfil atualizada com sucesso!', type: 'success' });
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
    this.toast.set(null);
  }

  dismissToast(): void {
    this.toast.set(null);
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

  // ── Ações: esportes favoritos ─────────────────────────────────────────────

  openFavoritesEditor(): void {
    this.selectedFavorites.set(this.favoriteSports().map((s) => s.id));
    this.favoritesError.set(null);
    this.editingFavorites.set(true);
  }

  cancelFavoritesEdit(): void {
    this.editingFavorites.set(false);
    this.favoritesError.set(null);
  }

  toggleFavoriteSport(sportId: string): void {
    this.selectedFavorites.update((current) =>
      current.includes(sportId) ? current.filter((id) => id !== sportId) : [...current, sportId],
    );
  }

  isFavoriteSelected(sportId: string): boolean {
    return this.selectedFavorites().includes(sportId);
  }

  saveFavoriteSports(): void {
    if (!this.playerId || this.savingFavorites()) return;

    this.savingFavorites.set(true);
    this.favoritesError.set(null);

    this.configService
      .updateFavoriteSports(this.selectedFavorites())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingFavorites.set(false)),
      )
      .subscribe({
        next: () => {
          this.editingFavorites.set(false);
          this.toast.set({
            message: 'Esportes favoritos atualizados com sucesso!',
            type: 'success',
          });
        },
        error: () =>
          this.favoritesError.set(
            this.configService.favoriteSportsError() ?? 'Erro ao salvar esportes favoritos.',
          ),
      });
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
