import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
  ElementRef,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NgxMaskDirective } from 'ngx-mask';
import { ServiceCourt } from '../../services/service-court';
import { SurfaceEnum, ResponseCourtDTO, SURFACE_LABELS } from '../../models/model-court';
import { ExistingPhoto, ImageDTO, NewPhoto } from '../../models/model-club';
import { ServiceSport } from '../../../../core/services/service-sport';
import { Modal } from '../../../../shared/components/modal/modal';
import { ToastAlert } from '../../../../shared/components/toast-alert/toast-alert';
import { ImageCarousel } from '../../../../shared/components/image-carousel/image-carousel';
import { ServiceSubscriptionUsage } from '../../services/service-subscription-usage';
import { getApiErrorMessage, isLimitExceededError } from '../../../../core/utils/api-error';
import { Observable, finalize, forkJoin } from 'rxjs';

type FormMode = 'create' | 'edit' | null;
type ToastState = { message: string; type: 'success' | 'error' | 'warning' | 'info' };

/**
 * Converte o valor do input mascarado (ex.: "1234,50", "1234.50" ou "R$ 1.234,50") em número.
 * Retorna NaN quando o valor é vazio ou inválido.
 */
function parsePrice(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;

  const cleaned = value.replace(/R\$|\s/g, '');
  if (cleaned === '') return NaN;

  // Com vírgula: formato brasileiro (pontos são separadores de milhar).
  // Sem vírgula: ponto, se existir, é o separador decimal.
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;

  return Number(normalized);
}

function priceValidator(control: AbstractControl): ValidationErrors | null {
  const raw = control.value;
  if (raw === null || raw === '') return null; // deixa o `required` cuidar do vazio

  const price = parsePrice(raw);
  return Number.isNaN(price) || price < 0 ? { price: true } : null;
}

@Component({
  selector: 'app-court',
  imports: [ReactiveFormsModule, Modal, RouterLink, ToastAlert, NgOptimizedImage, ImageCarousel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './courts.html',
})
export class Courts implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly courtService = inject(ServiceCourt);
  protected readonly sportService = inject(ServiceSport);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute); // Injeção da rota para pegar o ID
  private readonly destroyRef = inject(DestroyRef);
  private readonly usageService = inject(ServiceSubscriptionUsage);

  protected readonly planName = this.usageService.planName;
  private currentClubId: string = '';

  protected readonly courtUsage = computed(() =>
    this.usageService.courtUsageFor(this.currentClubId),
  );

  // fail-open: sem dados carregados não bloqueia (o backend valida de qualquer forma)
  protected readonly canCreateCourt = computed(() => {
    const usage = this.courtUsage();
    return usage === null || usage.used < usage.limit;
  });
  protected readonly togglingIds = signal<ReadonlySet<string>>(new Set());

  // com o limite atingido (usage.used >= usage.limit), quadras inativas não podem ser ativadas
  protected readonly limitReached = computed(() => !this.canCreateCourt());

  // --- Toast ---
  protected readonly toast = signal<ToastState | null>(null);

  protected dismissToast(): void {
    this.toast.set(null);
  }

  private showLimitToast(message?: string): void {
    const usage = this.courtUsage();
    this.toast.set({
      message:
        message ??
        `Você atingiu o limite de ${usage?.limit ?? ''} quadra(s) do seu plano. Faça upgrade para adicionar mais.`,
      type: 'warning',
    });
  }

  // --- Enum options for selects ---
  protected readonly surfaceOptions = Object.values(SurfaceEnum).map((value) => ({
    value,
    label: SURFACE_LABELS[value],
  }));

  // --- Local state ---
  protected readonly formMode = signal<FormMode>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteConfirmId = signal<string | null>(null);

  // --- Esportes selecionados (fora do reactive form, mesmo padrão das fotos) ---
  protected readonly selectedSportIds = signal<string[]>([]);
  protected readonly sportsTouched = signal(false);

  protected readonly isSubmitting = signal(false);

  protected readonly MAX_PHOTOS = 3;

  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly existingPhotos = signal<ExistingPhoto[]>([]);
  protected readonly newPhotos = signal<NewPhoto[]>([]);
  protected readonly draggedPhotoId = signal<string | null>(null);
  protected readonly dragOverPhotoId = signal<string | null>(null);
  private readonly removedExistingIds = signal<Set<string>>(new Set());
  private initialExistingOrder: string[] = [];

  protected readonly totalPhotosCount = computed(
    () => this.existingPhotos().length + this.newPhotos().length,
  );
  protected readonly canAddMorePhotos = computed(() => this.totalPhotosCount() < this.MAX_PHOTOS);
  protected readonly remainingPhotoSlots = computed(
    () => this.MAX_PHOTOS - this.totalPhotosCount(),
  );

  protected readonly isFormOpen = computed(() => this.formMode() !== null);
  protected readonly isEditing = computed(() => this.formMode() === 'edit');

  // --- Navigation ---

  protected goToSchedules(courtId: string): void {
    this.router.navigate(['/admin/club', this.currentClubId, 'court', courtId, 'schedule']);
  }

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    surface: [null as SurfaceEnum | null, Validators.required],
    isCovered: [false],
    description: [''],
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly hasSports = computed(() => this.selectedSportIds().length > 0);

  protected readonly isSubmitEnabled = computed(() => {
    if (!this.hasSports()) return false;
    if (this.formMode() === 'create') {
      return this.formStatus() === 'VALID' && this.newPhotos().length > 0;
    }
    return this.formStatus() === 'VALID';
  });

  ngOnInit(): void {
    this.currentClubId =
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';

    this.loadCourts();
    this.sportService.getAll().subscribe();
    this.usageService.refresh();

    this.destroyRef.onDestroy(() => this.clearPhotosState());
  }

  private loadCourts(): void {
    this.courtService.getByClubId(this.currentClubId).subscribe();
  }

  // --- Form actions ---

  protected openCreate(): void {
    if (!this.canCreateCourt()) {
      this.showLimitToast();
      return;
    }

    this.form.reset({
      name: '',
      surface: null,
      isCovered: false,
      description: '',
    });
    this.clearPhotosState();
    this.selectedSportIds.set([]);
    this.sportsTouched.set(false);
    this.editingId.set(null);
    this.formMode.set('create');
  }

  protected openEdit(court: ResponseCourtDTO): void {
    this.form.reset({
      name: court.name,
      surface: court.surface,
      isCovered: court.isCovered,
      // "1234,50": a máscara aplica o separador de milhar e o prefixo na exibição
      description: court.description,
    });
    this.resetPhotosState(court.images);
    this.selectedSportIds.set(court.sports.map((s) => s.id));
    this.sportsTouched.set(false);
    this.editingId.set(court.id);
    this.formMode.set('edit');
  }

  protected closeForm(): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.form.reset();
    this.clearPhotosState();
    this.selectedSportIds.set([]);
    this.sportsTouched.set(false);
  }

  // --- Fotos ---

  private resetPhotosState(images: ImageDTO[] | undefined | null): void {
    this.newPhotos().forEach((p) => URL.revokeObjectURL(p.previewUrl));
    this.newPhotos.set([]);

    const sorted = [...(images ?? [])].sort((a, b) => a.order - b.order);
    this.existingPhotos.set(
      sorted.map((image) => ({
        kind: 'existing' as const,
        id: image.id,
        thumbUrl: image.thumbUrl,
      })),
    );
    this.initialExistingOrder = sorted.map((image) => image.id);
    this.removedExistingIds.set(new Set());
    this.draggedPhotoId.set(null);
    this.dragOverPhotoId.set(null);
  }

  private clearPhotosState(): void {
    this.resetPhotosState([]);
  }

  protected triggerFileInput(): void {
    this.fileInputRef()?.nativeElement.click();
  }

  protected onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const availableSlots = this.remainingPhotoSlots();
    const incoming = Array.from(files).slice(0, availableSlots);

    if (files.length > availableSlots) {
      this.toast.set({
        message: `Você só pode adicionar mais ${availableSlots} foto${availableSlots === 1 ? '' : 's'} (máximo de ${this.MAX_PHOTOS}).`,
        type: 'warning',
      });
    }

    const newPhotos: NewPhoto[] = incoming
      .filter((file) => this.validatePhotoFile(file))
      .map((file) => ({
        kind: 'new' as const,
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    if (newPhotos.length > 0) {
      this.newPhotos.update((current) => [...current, ...newPhotos]);
    }

    input.value = '';
  }

  private validatePhotoFile(file: File): boolean {
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!file.type.startsWith('image/')) {
      this.toast.set({ message: `"${file.name}" não é uma imagem válida.`, type: 'error' });
      return false;
    }
    if (file.size > maxSizeBytes) {
      this.toast.set({ message: `"${file.name}" excede o tamanho máximo de 5MB.`, type: 'error' });
      return false;
    }
    return true;
  }

  protected removeExistingPhoto(photo: ExistingPhoto): void {
    this.removedExistingIds.update((current) => new Set(current).add(photo.id));
    this.existingPhotos.update((current) => current.filter((p) => p.id !== photo.id));
  }

  protected removeNewPhoto(photo: NewPhoto): void {
    URL.revokeObjectURL(photo.previewUrl);
    this.newPhotos.update((current) => current.filter((p) => p.id !== photo.id));
  }

  protected onExistingDragStart(photo: ExistingPhoto, event: DragEvent): void {
    this.draggedPhotoId.set(photo.id);
    event.dataTransfer?.setData('text/plain', photo.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected onExistingDragOver(photo: ExistingPhoto, event: DragEvent): void {
    event.preventDefault();
    if (photo.id !== this.draggedPhotoId()) {
      this.dragOverPhotoId.set(photo.id);
    }
  }

  protected onExistingDragLeave(photo: ExistingPhoto): void {
    if (this.dragOverPhotoId() === photo.id) {
      this.dragOverPhotoId.set(null);
    }
  }

  protected onExistingDrop(target: ExistingPhoto, event: DragEvent): void {
    event.preventDefault();
    const draggedId = this.draggedPhotoId();
    this.dragOverPhotoId.set(null);
    this.draggedPhotoId.set(null);
    if (!draggedId || draggedId === target.id) return;

    this.existingPhotos.update((current) => {
      const fromIndex = current.findIndex((p) => p.id === draggedId);
      const toIndex = current.findIndex((p) => p.id === target.id);
      if (fromIndex === -1 || toIndex === -1) return current;

      const updated = [...current];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }

  protected onExistingDragEnd(): void {
    this.draggedPhotoId.set(null);
    this.dragOverPhotoId.set(null);
  }

  private hasExistingOrderChanged(): boolean {
    const currentIds = this.existingPhotos().map((p) => p.id);
    const filteredInitial = this.initialExistingOrder.filter((id) => currentIds.includes(id));
    return JSON.stringify(currentIds) !== JSON.stringify(filteredInitial);
  }

  protected isToggleBlocked(court: ResponseCourtDTO): boolean {
    return this.togglingIds().has(court.id) || (!court.isCourtActive && this.limitReached());
  }
  protected onToggleActive(court: ResponseCourtDTO, event: Event): void {
    const input = event.target as HTMLInputElement;

    if (this.isToggleBlocked(court)) {
      input.checked = court.isCourtActive;
      return;
    }

    this.togglingIds.update((ids) => new Set(ids).add(court.id));

    this.courtService
      .toggleActive(court.id)
      .pipe(
        finalize(() =>
          this.togglingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(court.id);
            return next;
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.usageService.refresh();
          this.toast.set({
            message: court.isCourtActive ? 'Quadra desativada.' : 'Quadra ativada.',
            type: 'success',
          });
        },
        error: (err: unknown) => {
          // o checkbox já mudou visualmente; volta para o valor real
          input.checked = court.isCourtActive;
          this.courtService.clearError();
          this.toast.set({
            message: getApiErrorMessage(err),
            type: isLimitExceededError(err) ? 'warning' : 'error',
          });
        },
      });
  }
  // --- Esportes ---

  protected toggleSport(id: string): void {
    this.sportsTouched.set(true);
    this.selectedSportIds.update((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );
  }

  protected isSportSelected(id: string): boolean {
    return this.selectedSportIds().includes(id);
  }

  protected onSubmit(): void {
    this.sportsTouched.set(true);

    if (!this.isSubmitEnabled()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, surface, isCovered, description } = this.form.getRawValue();

    if (this.formMode() === 'create') {
      this.courtService
        .create({
          name: name!,
          sportIds: this.selectedSportIds(),
          surface: surface!,
          isCovered: isCovered!,
          description: description ? description : '',
          clubId: this.currentClubId,
          images: this.newPhotos().map((p) => p.file),
        })
        .subscribe({
          next: () => {
            this.closeForm();
            this.loadCourts();
            this.usageService.refresh();
          },
          error: (err: unknown) => {
            if (isLimitExceededError(err)) {
              // Estourou o limite (outra aba, plano alterado, etc.): fecha o modal e sincroniza
              this.closeForm();
              this.courtService.clearError();
              this.showLimitToast(getApiErrorMessage(err));
              this.usageService.refresh();
              return;
            }
            console.error('Erro ao criar quadra', err);
            this.toast.set({ message: getApiErrorMessage(err), type: 'error' });
          },
        });
    } else {
      const id = this.editingId();
      if (id === null) return;

      this.submitUpdate(id);
    }
  }

  private submitUpdate(id: string): void {
    const { name, surface, isCovered, description } = this.form.getRawValue();

    this.isSubmitting.set(true);

    const requests: Observable<unknown>[] = [
      this.courtService.update(id, {
        name: name!,
        sportIds: this.selectedSportIds(),
        surface: surface!,
        isCovered: isCovered!,
        description: description ? description : '',
      }),
    ];

    const filesToUpload = this.newPhotos().map((p) => p.file);
    if (filesToUpload.length > 0) {
      requests.push(this.courtService.addImages(id, filesToUpload));
    }

    for (const imageId of this.removedExistingIds()) {
      requests.push(this.courtService.deleteImage(id, imageId));
    }

    if (this.hasExistingOrderChanged()) {
      const orders = this.existingPhotos().map((p, index) => ({ id: p.id, order: index }));
      requests.push(this.courtService.reorderImages(id, orders));
    }

    forkJoin(requests)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.closeForm();
          this.loadCourts();
          this.toast.set({ message: 'Quadra atualizada com sucesso!', type: 'success' });
        },
        error: (err: unknown) => {
          console.error('Erro ao atualizar quadra', err);
          this.courtService.clearError();
          this.toast.set({ message: getApiErrorMessage(err), type: 'error' });
        },
      });
  }

  // --- Delete ---

  protected requestDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  protected confirmDelete(): void {
    const id = this.deleteConfirmId();
    if (id === null) return;
    this.courtService.delete(id).subscribe({
      next: () => {
        this.deleteConfirmId.set(null);
        this.loadCourts();
        this.usageService.refresh();
      },
    });
  }

  protected cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  // --- Helpers ---

  protected getSurfaceName(value: string): string {
    return SURFACE_LABELS[value as SurfaceEnum] ?? 'Desconhecido';
  }

  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
