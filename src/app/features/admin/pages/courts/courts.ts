import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceCourt } from '../../services/service-court';
import { TypeEnum, SurfaceEnum, ResponseCourtDTO } from '../../models/model-court';

type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-court',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './courts.html',
})
export class Courts implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly courtService = inject(ServiceCourt);
  private readonly router = inject(Router);

  // --- Enum options for selects ---
  protected readonly typeOptions = Object.entries(TypeEnum)
    .filter(([, v]) => typeof v === 'number' && (v as number) !== 0)
    .map(([label, value]) => ({ label, value: value as number }));

  protected readonly surfaceOptions = Object.entries(SurfaceEnum)
    .filter(([, v]) => typeof v === 'number' && (v as number) !== 0)
    .map(([label, value]) => ({ label, value: value as number }));

  // --- Local state ---
  protected readonly formMode = signal<FormMode>(null);
  protected readonly editingId = signal<string | null>(null); // Alterado de number para string
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly deleteConfirmId = signal<string | null>(null); // Alterado de number para string

  protected readonly isFormOpen = computed(() => this.formMode() !== null);
  protected readonly isEditing = computed(() => this.formMode() === 'edit');

  // --- Form ---
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    type: [null as TypeEnum | null, Validators.required],
    surface: [null as SurfaceEnum | null, Validators.required],
    isCovered: [false],
    pricePerHour: [null as number | null, [Validators.required, Validators.min(0)]],
    description: ['', Validators.required],
    clubId: ['', Validators.required],
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly isSubmitEnabled = computed(() => {
    if (this.formMode() === 'create') {
      return this.formStatus() === 'VALID' && this.selectedFiles().length > 0;
    }
    return this.formStatus() === 'VALID';
  });

  ngOnInit(): void {
    this.courtService.getAll().subscribe();
  }

  // --- Form actions ---

  protected openCreate(): void {
    this.form.reset({
      name: '',
      type: null,
      surface: null,
      isCovered: false,
      pricePerHour: null,
      description: '',
      clubId: '',
    });
    this.selectedFiles.set([]);
    this.editingId.set(null);
    this.formMode.set('create');
  }

  protected openEdit(court: ResponseCourtDTO): void {
    this.form.reset({
      name: court.name,
      type: court.type,
      surface: court.surface,
      isCovered: court.isCovered,
      pricePerHour: court.pricePerHour,
      description: court.description,
      clubId: court.clubId,
    });
    this.selectedFiles.set([]);
    this.editingId.set(court.id);
    this.formMode.set('edit');
  }

  protected closeForm(): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.form.reset();
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles.set(Array.from(input.files));
    }
  }

  protected removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  protected onSubmit(): void {
    if (!this.isSubmitEnabled()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, type, surface, isCovered, pricePerHour, description, clubId } =
      this.form.getRawValue();

    if (this.formMode() === 'create') {
      this.courtService
        .create({
          name: name!,
          type: type!,
          surface: surface!,
          isCovered: isCovered!,
          pricePerHour: pricePerHour!,
          description: description!,
          clubId: clubId!,
          images: this.selectedFiles(),
        })
        .subscribe({
          next: () => {
             this.closeForm(); // Alterado para fechar o modal em vez de tentar navegar, se for a mesma rota
          },
          error: (err: unknown) => {
             console.error('Erro ao criar quadra', err);
             // O erro já foi setado no signal _error pelo handleError do próprio service!
          },
        });
    } else {
      const id = this.editingId();
      if (id === null) return;

      this.courtService
        .update(id, {
          name: name!,
          type: type!,
          surface: surface!,
          isCovered: isCovered!,
          pricePerHour: pricePerHour!,
          description: description!,
        })
        .subscribe({ next: () => this.closeForm() });
    }
  }

  // --- Delete ---

  protected requestDelete(id: string): void { // Alterado de number para string
    this.deleteConfirmId.set(id);
  }

  protected confirmDelete(): void {
    const id = this.deleteConfirmId();
    if (id === null) return;
    this.courtService
      .delete(id)
      .subscribe({ next: () => this.deleteConfirmId.set(null) });
  }

  protected cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  // --- Helpers ---

  protected getTypeName(value: number): string {
    return TypeEnum[value] ?? 'Desconhecido';
  }

  protected getSurfaceName(value: number): string {
    return SurfaceEnum[value] ?? 'Desconhecido';
  }

  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
