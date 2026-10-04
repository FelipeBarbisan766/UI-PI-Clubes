import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';
import { ResponseClubByIdDTO } from '../../../models/model-club';
import { ResponseCourtDTO } from '../../../models/model-court';
import { ReserveAvailabilityChangedDTO } from '../../../models/model-reserve';
import { ScheduleAvailabilityDTO } from '../../../models/model-schedule';
import { ServiceSchedule } from '../../../services/service-schedule';
import { ServiceReserve } from '../../../services/service-reserve';
import { ServiceCourtAvailabilitySignalR } from '../../../services/service-court-availability-signalr';
import { AuthService } from '../../../../../core/services/auth-service';
import { AuthRequiredModalService } from '../../../../../shared/components/auth-required-modal/auth-required-modal-service';

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

// ── Funções puras ────────────────────────────────────────────────────────────

const UNAVAILABLE_STATUSES = new Set<string>(['AguardandoConfirmacao', 'Confirmada', 'Recusada']);

function isSlotAvailableForStatus(status: string): boolean {
  return !UNAVAILABLE_STATUSES.has(status);
}

function formatPrice(price: number): string {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Gera os próximos `days` dias a partir de hoje em 'YYYY-MM-DD'. */
function buildAvailableDates(days = 7): string[] {
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  });
}

function mapAvailabilityToSlots(dtos: ScheduleAvailabilityDTO[], date: string): TimeSlot[] {
  return dtos.map((dto) => ({
    id: dto.id,
    date,
    startTime: dto.startTime.slice(0, 5),
    endTime: dto.endTime.slice(0, 5),
    available: dto.isAvailable,
  }));
}

const SLOT_CLASS_SELECTED = 'bg-primary text-primary-content border-primary shadow-md';
const SLOT_CLASS_AVAILABLE =
  'bg-success/10 text-success border-success/20 hover:bg-success/20 cursor-pointer';
const SLOT_CLASS_UNAVAILABLE = 'bg-error/10 text-error/60 border-transparent cursor-not-allowed';

@Component({
  selector: 'app-modal-reserve',
  templateUrl: './modal-reserve.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalReserve {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scheduleService = inject(ServiceSchedule);
  private readonly reserveService = inject(ServiceReserve);
  private readonly authService = inject(AuthService);
  private readonly authRequiredModal = inject(AuthRequiredModalService);
  private readonly courtAvailabilitySignalR = inject(ServiceCourtAvailabilitySignalR);

  // ── Inputs / Outputs ──
  readonly club = input.required<ResponseClubByIdDTO>();
  readonly court = input.required<ResponseCourtDTO>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  // ── Estado dos slots (delegado ao serviço) ──
  readonly slotsLoading = this.scheduleService.loading;
  readonly slotsError = this.scheduleService.error;

  // ── Estado local ──
  readonly availableDates = buildAvailableDates();
  readonly selectedDate = signal<string>(this.availableDates[0] ?? '');
  readonly slotsForDate = signal<TimeSlot[]>([]);
  readonly selectedSlotId = signal<string | null>(null);

  readonly isConfirming = signal(false);
  readonly bookingError = signal<string | null>(null);
  readonly bookingSuccess = signal(false);

  readonly selectedSlot = computed<TimeSlot | null>(() => {
    const id = this.selectedSlotId();
    return id ? (this.slotsForDate().find((s) => s.id === id) ?? null) : null;
  });

  /** O horário escolhido foi tomado por outra pessoa enquanto o modal estava aberto. */
  readonly selectedSlotTaken = computed(() => {
    const slot = this.selectedSlot();
    return !!slot && !slot.available && !this.bookingSuccess();
  });

  readonly canConfirm = computed(() => {
    const slot = this.selectedSlot();
    return !!slot && slot.available && !this.isConfirming();
  });

  private readonly courtAndDate = computed(() => ({
    courtId: this.court().id,
    date: this.selectedDate(),
  }));

  constructor() {
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      if (!dialog.open) dialog.showModal();
    });

    toObservable(this.courtAndDate)
      .pipe(
        tap(() => {
          this.slotsForDate.set([]);
          this.selectedSlotId.set(null);
          this.bookingError.set(null);
        }),
        switchMap(({ courtId, date }) => {
          if (!courtId || !date) return EMPTY;

          return this.scheduleService.getAvailability(courtId, date).pipe(
            map((dtos) => mapAvailabilityToSlots(dtos, date)),
            catchError(() => EMPTY),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((slots) => this.slotsForDate.set(slots));

    this.courtAvailabilitySignalR.reserveStatusChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dto) => this.applyReserveStatusChanged(dto));
  }

  // ── Ações ────────────────────────────────────────────────────────────────

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  selectSlot(slot: TimeSlot): void {
    if (!slot.available || this.isConfirming() || this.bookingSuccess()) return;
    this.bookingError.set(null);
    this.selectedSlotId.set(slot.id);
  }

  /** Fecha o <dialog>; o evento `close` do template emite `closed` para o pai. */
  requestClose(): void {
    if (this.isConfirming()) return;
    this.dialog().nativeElement.close();
  }

  onDialogCancel(event: Event): void {
    // ESC durante a confirmação não deve fechar o modal
    if (this.isConfirming()) event.preventDefault();
  }

  onDialogClosed(): void {
    this.closed.emit();
  }

  confirmBooking(): void {
    if (!this.authService.isAuthenticated()) {
      this.forceClose();
      this.authRequiredModal.show(
        'Você precisa estar logado para fazer reservas neste clube.',
        this.router.url,
      );
      return;
    }

    if (this.authService.needsCompleteProfile()) {
      this.forceClose();
      this.router.navigate(['/complete-profile']);
      return;
    }

    const slot = this.selectedSlot();
    if (!slot || !slot.available) return;

    this.isConfirming.set(true);
    this.bookingError.set(null);

    this.authService
      .getPlayerMe()
      .pipe(
        switchMap((player) =>
          this.reserveService.create({
            date: `${slot.date}T00:00:00`,
            scheduleId: slot.id,
            playerId: player.id,
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isConfirming.set(false);
          this.bookingSuccess.set(true);
          this.markSlotUnavailable(slot.id);
        },
        error: (err: Error) => {
          this.isConfirming.set(false);
          this.bookingError.set(err.message);
        },
      });
  }

  slotClass(slot: TimeSlot): string {
    if (this.selectedSlotId() === slot.id) return SLOT_CLASS_SELECTED;
    return slot.available ? SLOT_CLASS_AVAILABLE : SLOT_CLASS_UNAVAILABLE;
  }

  // ── Helpers expostos ao template ─────────────────────────────────────────

  readonly formatPrice = formatPrice;
  readonly formatDate = formatDate;

  // ── Helpers privados ─────────────────────────────────────────────────────

  private forceClose(): void {
    this.dialog().nativeElement.close();
  }

  private markSlotUnavailable(scheduleId: string): void {
    this.slotsForDate.update((slots) =>
      slots.map((s) => (s.id === scheduleId ? { ...s, available: false } : s)),
    );
  }

  private applyReserveStatusChanged(dto: ReserveAvailabilityChangedDTO): void {
    if (dto.courtId !== this.court().id) return;
    if (dto.date.slice(0, 10) !== this.selectedDate()) return;

    this.slotsForDate.update((slots) =>
      slots.map((slot) =>
        slot.id === dto.scheduleId
          ? { ...slot, available: isSlotAvailableForStatus(dto.status) }
          : slot,
      ),
    );
  }
}