import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  ElementRef,
  viewChild,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  switchMap,
} from 'rxjs/operators';
import { ServiceClub } from '../../services/service-club';
import { ViaCepService } from '../../../../core/services/via-cep';
import { NgxMaskDirective } from 'ngx-mask';
import { ToastAlert } from '../../../../shared/components/toast-alert/toast-alert';
import { NgOptimizedImage } from '@angular/common';
import { ExistingPhoto, NewPhoto } from '../../models/model-club';
import { forkJoin, Observable } from 'rxjs';

type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-club',
  imports: [ReactiveFormsModule, NgxMaskDirective, ToastAlert, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './config-club.html',
})
export class ConfigClub implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viaCepService = inject(ViaCepService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clubService = inject(ServiceClub);

  protected readonly deleteConfirmOpen = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly MAX_PHOTOS = 5;

  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly existingPhotos = signal<ExistingPhoto[]>([]);
  protected readonly newPhotos = signal<NewPhoto[]>([]);
  protected readonly draggedPhotoId = signal<string | null>(null);
  protected readonly dragOverPhotoId = signal<string | null>(null);
  private readonly removedExistingIds = signal<Set<string>>(new Set());
  private readonly photosDirty = signal(false);
  private initialExistingOrder: string[] = [];

  protected readonly totalPhotosCount = computed(
    () => this.existingPhotos().length + this.newPhotos().length,
  );
  protected readonly canAddMorePhotos = computed(() => this.totalPhotosCount() < this.MAX_PHOTOS);
  protected readonly remainingPhotoSlots = computed(
    () => this.MAX_PHOTOS - this.totalPhotosCount(),
  );

  protected readonly toast = signal<{ message: string; type: ToastType } | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phoneNumber: [''],
    description: [''],
    zipCode: ['', Validators.required],
    street: ['', Validators.required],
    number: [''],
    neighborhood: ['', Validators.required],
    complement: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['', Validators.required],
  });
  
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly isSubmitEnabled = computed(() => {
    this.formValue();
    this.formStatus();
    return (this.form.dirty || this.photosDirty()) && this.form.valid;
  });

  private clubId: string = '';

  constructor() {
    effect(() => {
      const club = this.clubService.selectedClub();
      if (!club) return;

      untracked(() => {
        this.form.patchValue(
          {
            name: club.name,
            phoneNumber: club.phoneNumber,
            description: club.description,
            zipCode: club.zipCode,
            street: club.street,
            number: club.number,
            neighborhood: club.neighborhood,
            complement: club.complement ?? '',
            city: club.city,
            state: club.state,
            country: club.country,
          },
          { emitEvent: false },
        );
        this.form.markAsPristine();
        this.resetPhotosState(club.imagesUrls);
      });
    });
  }

  private resetPhotosState(imagesUrls: string[] | undefined | null): void {
    this.newPhotos().forEach((p) => URL.revokeObjectURL(p.previewUrl));
    this.newPhotos.set([]);

    const urls = imagesUrls ?? [];
    this.existingPhotos.set(urls.map((url) => ({ kind: 'existing' as const, id: url, url })));
    this.initialExistingOrder = [...urls];
    this.removedExistingIds.set(new Set());
    this.photosDirty.set(false);
  }

  ngOnInit(): void {
    const clubId =
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';
    if (clubId) {
      this.clubId = clubId;
      this.clubService.getById(clubId).subscribe();
    }

    this.form.controls.zipCode.valueChanges
      .pipe(
        map((value) => (value ?? '').replace(/\D/g, '')),
        distinctUntilChanged(),
        debounceTime(300),
        filter((cep) => cep.length === 8),
        switchMap((cep) => this.viaCepService.getAddressByCep(cep)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (address) => {
          if (address.erro) {
            return;
          }

          this.form.patchValue({
            street: address.logradouro,
            neighborhood: address.bairro,
            city: address.localidade,
            state: address.uf,
            complement: address.complemento,
          });
        },
        error: (err: unknown) => {
          console.error('Erro ao buscar CEP', err);
        },
      });
  }

  protected goToCourts(clubId: string): void {
    this.router.navigate(['/admin/club', clubId, 'courts']);
  }

  protected onSubmit(): void {
    if (!this.isSubmitEnabled() || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitUpdate();
  }

  private submitUpdate(): void {
    const {
      name,
      phoneNumber,
      description,
      zipCode,
      street,
      number,
      neighborhood,
      complement,
      city,
      state,
      country,
    } = this.form.getRawValue();

    this.isSubmitting.set(true);

    const requests: Observable<unknown>[] = [];

    if (this.form.dirty) {
      requests.push(
        this.clubService.update(this.clubId, {
          name: name!,
          phoneNumber: phoneNumber!,
          description: description!,
          zipCode: zipCode!,
          street: street!,
          number: number!,
          neighborhood: neighborhood!,
          complement: complement ?? undefined,
          city: city!,
          state: state!,
          country: country!,
        }),
      );
    }

    const filesToUpload = this.newPhotos().map((p) => p.file);
    if (filesToUpload.length > 0) {
      requests.push(this.clubService.addImages(this.clubId, filesToUpload));
    }

    for (const id of this.removedExistingIds()) {
      requests.push(this.clubService.deleteImage(this.clubId, id));
    }

    if (this.hasExistingOrderChanged()) {
      const orders = this.existingPhotos().map((p, index) => ({ id: p.id, order: index }));
      requests.push(this.clubService.reorderImages(this.clubId, orders));
    }

    if (requests.length === 0) {
      this.isSubmitting.set(false);
      return;
    }

    forkJoin(requests)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.toast.set({ message: 'Clube atualizado com sucesso!', type: 'success' });
          this.clubService.getById(this.clubId).subscribe();
        },
        error: (err: unknown) => {
          console.error('Erro ao atualizar clube', err);
          this.toast.set({
            message: this.clubService.error() ?? 'Erro ao salvar as alterações.',
            type: 'error',
          });
        },
      });
  }

  protected onReset(): void {
    const club = this.clubService.selectedClub();
    if (!club) return;

    this.form.patchValue({
      name: club.name,
      phoneNumber: club.phoneNumber,
      description: club.description,
      zipCode: club.zipCode,
      street: club.street,
      number: club.number,
      neighborhood: club.neighborhood,
      complement: club.complement ?? '',
      city: club.city,
      state: club.state,
      country: club.country,
    });
    this.form.markAsPristine();
    this.resetPhotosState(club.imagesUrls);
    this.toast.set(null);
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
        kind: 'new',
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    if (newPhotos.length > 0) {
      this.newPhotos.update((current) => [...current, ...newPhotos]);
      this.photosDirty.set(true);
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
    this.photosDirty.set(true);
  }

  protected removeNewPhoto(photo: NewPhoto): void {
    URL.revokeObjectURL(photo.previewUrl);
    this.newPhotos.update((current) => current.filter((p) => p.id !== photo.id));
    this.photosDirty.set(true);
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
    this.photosDirty.set(true);
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

  protected dismissToast(): void {
    this.toast.set(null);
  }

  protected requestDelete(): void {
    this.deleteConfirmOpen.set(true);
  }

  protected confirmDelete(): void {
    const club = this.clubService.selectedClub();
    if (!club) return;
    this.clubService.delete(this.clubId).subscribe({
      next: () => this.deleteConfirmOpen.set(false),
      error: () => {
        this.toast.set({
          message: this.clubService.error() ?? 'Erro ao excluir o clube.',
          type: 'error',
        });
      },
    });
  }

  protected cancelDelete(): void {
    this.deleteConfirmOpen.set(false);
  }

  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
