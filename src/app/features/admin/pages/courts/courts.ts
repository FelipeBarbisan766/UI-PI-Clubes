import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceCourt } from '../../services/service-court';
import { SurfaceEnum, ResponseCourtDTO } from '../../models/model-court';
import { ServiceSport } from '../../../../core/services/service-sport';
import { Modal } from '../../../../shared/components/modal/modal';
import { ToastAlert } from '../../../../shared/components/toast-alert/toast-alert';
import { ServiceSubscriptionUsage } from '../../services/service-subscription-usage';
import { getApiErrorMessage, isLimitExceededError } from '../../../../core/utils/api-error';

type FormMode = 'create' | 'edit' | null;
type ToastState = { message: string; type: 'success' | 'error' | 'warning' | 'info' };

@Component({
  selector: 'app-court',
  imports: [ReactiveFormsModule, Modal, RouterLink, ToastAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './courts.html',
})
export class Courts implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly courtService = inject(ServiceCourt);
  protected readonly sportService = inject(ServiceSport);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute); // Injeção da rota para pegar o ID

  private currentClubId: string = '';

  // --- Limite do plano ---
  private readonly usageService = inject(ServiceSubscriptionUsage);

  protected readonly planName = this.usageService.planName;

  protected readonly courtUsage = computed(() =>
    this.usageService.courtUsageFor(this.currentClubId),
  );

  // fail-open: sem dados carregados não bloqueia (o backend valida de qualquer forma)
  protected readonly canCreateCourt = computed(() => {
    const usage = this.courtUsage();
    return usage === null || usage.used < usage.limit;
  });

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
  protected readonly surfaceOptions = Object.entries(SurfaceEnum)
    .filter(([, v]) => typeof v === 'string')
    .map(([label, value]) => ({ label, value: value as string }));

  // --- Local state ---
  protected readonly formMode = signal<FormMode>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly deleteConfirmId = signal<string | null>(null);

  // --- Esportes selecionados (fora do reactive form, mesmo padrão de selectedFiles) ---
  protected readonly selectedSportIds = signal<string[]>([]);
  protected readonly sportsTouched = signal(false);

  protected readonly isFormOpen = computed(() => this.formMode() !== null);
  protected readonly isEditing = computed(() => this.formMode() === 'edit');

  // --- Navigation ---

  protected goToSchedules(courtId: string): void {
    this.router.navigate(['/admin/club', this.currentClubId, 'court', courtId, 'schedule']);
  }

  // --- Form ---
  // clubId foi removido pois agora é preenchido de forma transparente via URL
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    surface: [null as SurfaceEnum | null, Validators.required],
    isCovered: [false],
    pricePerHour: [null as number | null, [Validators.required, Validators.min(0)]],
    description: ['', Validators.required],
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly hasSports = computed(() => this.selectedSportIds().length > 0);

  protected readonly isSubmitEnabled = computed(() => {
    if (this.formMode() === 'create') {
      return this.formStatus() === 'VALID' && this.selectedFiles().length > 0 && this.hasSports();
    }
    return this.formStatus() === 'VALID' && this.hasSports();
  });

  ngOnInit(): void {
    this.currentClubId =
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';

    this.loadCourts();
    this.sportService.getAll().subscribe();
    this.usageService.refresh();
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
      pricePerHour: null,
      description: '',
    });
    this.selectedFiles.set([]);
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
      pricePerHour: court.pricePerHour,
      description: court.description,
    });
    this.selectedFiles.set([]);
    this.selectedSportIds.set(court.sports.map((s) => s.id));
    this.sportsTouched.set(false);
    this.editingId.set(court.id);
    this.formMode.set('edit');
  }

  protected closeForm(): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.form.reset();
    this.selectedSportIds.set([]);
    this.sportsTouched.set(false);
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

    const { name, surface, isCovered, pricePerHour, description } = this.form.getRawValue();

    if (this.formMode() === 'create') {
      this.courtService
        .create({
          name: name!,
          sportIds: this.selectedSportIds(),
          surface: surface!,
          isCovered: isCovered!,
          pricePerHour: pricePerHour!,
          description: description!,
          clubId: this.currentClubId,
          images: this.selectedFiles(),
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

      this.courtService
        .update(id, {
          name: name!,
          sportIds: this.selectedSportIds(),
          surface: surface!,
          isCovered: isCovered!,
          pricePerHour: pricePerHour!,
          description: description!,
        })
        .subscribe({
          next: () => {
            this.closeForm();
            this.loadCourts();
          },
        });
    }
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
    return SurfaceEnum[value as keyof typeof SurfaceEnum] ?? 'Desconhecido';
  }

  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}