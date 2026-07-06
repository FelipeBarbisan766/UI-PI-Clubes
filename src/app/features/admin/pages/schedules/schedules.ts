import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceSchedule } from '../../services/service-schedule';
import {
  DayOfWeek,
  ResponseBulkScheduleDTO,
  ResponseScheduleDTO,
} from '../../models/model-schedule';
import { Modal } from '../../../../shared/components/modal/modal';

type FormMode = 'create' | 'edit' | 'bulk' | null;

@Component({
  selector: 'app-schedule',
  imports: [ReactiveFormsModule, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedules.html',
})
export class Schedules implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  protected readonly scheduleService = inject(ServiceSchedule);

  // --- Enum options for selects ---
  protected readonly dayOfWeekOptions = [
    { label: 'Domingo', value: DayOfWeek.Sunday },
    { label: 'Segunda-feira', value: DayOfWeek.Monday },
    { label: 'Terça-feira', value: DayOfWeek.Tuesday },
    { label: 'Quarta-feira', value: DayOfWeek.Wednesday },
    { label: 'Quinta-feira', value: DayOfWeek.Thursday },
    { label: 'Sexta-feira', value: DayOfWeek.Friday },
    { label: 'Sábado', value: DayOfWeek.Saturday },
  ];

  // --- Local state ---
  private courtId = '';
  protected readonly formMode = signal<FormMode>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteConfirmId = signal<string | null>(null);

  protected readonly isFormOpen = computed(() => this.formMode() !== null);
  protected readonly isEditing = computed(() => this.formMode() === 'edit');

  protected readonly selectedDays = signal<DayOfWeek[]>([]);
  protected readonly bulkResult = signal<ResponseBulkScheduleDTO | null>(null);

  // --- Form ---
  protected readonly form = this.fb.group({
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    isBlocked: [false],
    isReserved: [false],
    isFixed: [false],
    dayOfWeek: [null as DayOfWeek | null, Validators.required],
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly isSubmitEnabled = computed(() => this.formStatus() === 'VALID');

  ngOnInit(): void {
    this.courtId = this.route.snapshot.paramMap.get('courtId') ?? '';
    this.scheduleService.getByCourtId(this.courtId).subscribe();
  }

  protected readonly scheduleGroups = computed(() => {
    const schedules = this.scheduleService.schedules();

    return this.dayOfWeekOptions
      .map((day) => ({
        day: day.value,
        label: day.label,
        schedules: schedules
          .filter((s) => s.dayOfWeek === day.value)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }))
      .filter((group) => group.schedules.length > 0);
  });

  protected readonly bulkForm = this.fb.group({
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    slotDurationMinutes: [60, [Validators.required, Validators.min(15)]],
  });

  private readonly bulkFormStatus = toSignal(this.bulkForm.statusChanges, {
    initialValue: this.bulkForm.status,
  });

  protected readonly isBulkSubmitEnabled = computed(
    () => this.bulkFormStatus() === 'VALID' && this.selectedDays().length > 0,
  );
  protected openBulkCreate(): void {
    this.bulkForm.reset({ startTime: '', endTime: '', slotDurationMinutes: 60 });
    this.selectedDays.set([]);
    this.bulkResult.set(null);
    this.formMode.set('bulk');
  }

  protected toggleDay(day: DayOfWeek): void {
    this.selectedDays.update((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
    );
  }

  protected isDaySelected(day: DayOfWeek): boolean {
    return this.selectedDays().includes(day);
  }

  protected onBulkSubmit(): void {
    if (!this.isBulkSubmitEnabled()) {
      this.bulkForm.markAllAsTouched();
      return;
    }

    const { startTime, endTime, slotDurationMinutes } = this.bulkForm.getRawValue();

    this.scheduleService
      .createBulk(this.courtId, {
        daysOfWeek: this.selectedDays(),
        startTime: startTime!,
        endTime: endTime!,
        slotDurationMinutes: slotDurationMinutes!,
        courtId: this.courtId,
      })
      .subscribe({
        next: (result) => this.bulkResult.set(result),
        error: (err: unknown) => console.error('Erro ao criar horários em massa', err),
      });
  }

  // --- Form actions ---

  protected openCreate(): void {
    this.form.reset({
      startTime: '',
      endTime: '',
      isBlocked: false,
      isReserved: false,
      isFixed: false,
      dayOfWeek: null,
    });
    this.editingId.set(null);
    this.formMode.set('create');
  }

  protected openEdit(schedule: ResponseScheduleDTO): void {
    this.form.reset({
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      dayOfWeek: schedule.dayOfWeek,
    });
    this.editingId.set(schedule.id);
    this.formMode.set('edit');
  }

  protected closeForm(): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.form.reset();
    this.bulkForm.reset();
    this.selectedDays.set([]);
    this.bulkResult.set(null);
  }

  protected onSubmit(): void {
    if (!this.isSubmitEnabled()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.formMode() === 'create') {
      this._submitCreate();
    } else {
      this._submitUpdate();
    }
  }

  private _submitCreate(): void {
    const { startTime, endTime, dayOfWeek } = this.form.getRawValue();

    this.scheduleService
      .create({
        startTime: startTime!,
        endTime: endTime!,
        dayOfWeek: dayOfWeek!,
        courtId: this.courtId,
      })
      .subscribe({
        next: () => this.closeForm(),
        error: (err: unknown) => {
          console.error('Erro ao criar horário', err);
        },
      });
  }

  private _submitUpdate(): void {
    const id = this.editingId();
    if (id === null) return;

    const { startTime, endTime, dayOfWeek } = this.form.getRawValue();

    this.scheduleService
      .update(id, {
        startTime: startTime!,
        endTime: endTime!,
        dayOfWeek: dayOfWeek!,
      })
      .subscribe({ next: () => this.closeForm() });
  }

  // --- Delete ---

  protected requestDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  protected confirmDelete(): void {
    const id = this.deleteConfirmId();
    if (id === null) return;
    this.scheduleService.delete(id).subscribe({ next: () => this.deleteConfirmId.set(null) });
  }

  protected cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  // --- Helpers ---

  protected getDayName(value: DayOfWeek): string {
    return this.dayOfWeekOptions.find((d) => d.value === value)?.label ?? 'Desconhecido';
  }

  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
  protected bulkFieldInvalid(field: string): boolean {
    const ctrl = this.bulkForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
