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
import { ActivatedRoute, Router } from '@angular/router';
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
  price: number;
  available: boolean;
}

interface CalendarMonth {
  year: number;
  month: number; // 0-11
}

export interface CalendarCell {
  date: string; // 'YYYY-MM-DD'
  day: number;
  disabled: boolean;
  isToday: boolean;
}

export interface WeekDay {
  date: string; // 'YYYY-MM-DD'
  weekday: string; // 'seg', 'ter'...
  day: number;
  disabled: boolean;
  isToday: boolean;
}

// ── Constantes ───────────────────────────────────────────────────────────────

/** Quantos dias à frente (a partir de hoje) é possível reservar. */
const BOOKING_WINDOW_DAYS = 60;
const RESTORE_UNAVAILABLE_MESSAGE = 'Esse horário não está mais disponível. Escolha outro horário.';

const WEEKDAYS = [
  { short: 'D', full: 'Domingo' },
  { short: 'S', full: 'Segunda' },
  { short: 'T', full: 'Terça' },
  { short: 'Q', full: 'Quarta' },
  { short: 'Q', full: 'Quinta' },
  { short: 'S', full: 'Sexta' },
  { short: 'S', full: 'Sábado' },
] as const;

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

function formatDateLong(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** 'seg', 'ter'... (sem o ponto final que o Intl adiciona). */
function formatWeekdayShort(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`)
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '');
}

/** Formata a data local como 'YYYY-MM-DD' (sem o desvio de fuso do toISOString). */
function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(dateStr: string, amount: number): string {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
}

/** Domingo da semana que contém a data. */
function startOfWeek(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return addDays(dateStr, -date.getDay());
}

function monthIndex({ year, month }: CalendarMonth): number {
  return year * 12 + month;
}

/** Retorna as células do mês; `null` representa os espaços antes do dia 1. */
function buildMonthCells(
  { year, month }: CalendarMonth,
  minDate: string,
  maxDate: string,
  today: string,
): (CalendarCell | null)[] {
  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (CalendarCell | null)[] = Array.from({ length: leadingBlanks }, () => null);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = toIsoDate(new Date(year, month, day));
    cells.push({
      date,
      day,
      disabled: date < minDate || date > maxDate,
      isToday: date === today,
    });
  }
  return cells;
}

/** Os 7 dias (domingo a sábado) da semana que contém `selectedDate`. */
function buildWeekDays(
  selectedDate: string,
  minDate: string,
  maxDate: string,
  today: string,
): WeekDay[] {
  const start = startOfWeek(selectedDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      weekday: formatWeekdayShort(date),
      day: Number(date.slice(8, 10)),
      disabled: date < minDate || date > maxDate,
      isToday: date === today,
    };
  });
}

/** Converte 'HH:mm' (24h) em minutos desde a meia-noite. */
function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Ordena por horário de início e, em caso de empate, pelo de término. */
function compareSlotsByTime(a: TimeSlot, b: TimeSlot): number {
  return (
    toMinutes(a.startTime) - toMinutes(b.startTime) || toMinutes(a.endTime) - toMinutes(b.endTime)
  );
}

function mapAvailabilityToSlots(dtos: ScheduleAvailabilityDTO[], date: string): TimeSlot[] {
  return dtos
    .map((dto) => ({
      id: dto.id,
      date,
      startTime: dto.startTime.slice(0, 5),
      endTime: dto.endTime.slice(0, 5),
      price: dto.price,
      available: dto.isAvailable,
    }))
    .sort(compareSlotsByTime);
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
  private readonly route = inject(ActivatedRoute);
  // ── Inputs / Outputs ──
  readonly club = input.required<ResponseClubByIdDTO>();
  readonly court = input.required<ResponseCourtDTO>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  // ── Estado dos slots (delegado ao serviço) ──
  readonly slotsLoading = this.scheduleService.loading;
  readonly slotsError = this.scheduleService.error;

  // ── Datas / calendário ──
  private readonly now = new Date();
  /** Hoje: nenhuma data anterior pode ser selecionada. */
  readonly minDate = toIsoDate(this.now);
  readonly maxDate = addDays(this.minDate, BOOKING_WINDOW_DAYS);
  readonly weekdays = WEEKDAYS;

  /** Data/horário vindos do returnUrl após o login (lidos uma única vez). */
  private pendingRestore = this.readRestoreParams();
  readonly slotNotice = signal<string | null>(null);

  readonly selectedDate = signal<string>(this.initialDate());
  readonly viewMonth = signal<CalendarMonth>(this.monthOf(this.selectedDate()));

  readonly monthLabel = computed(() => {
    const { year, month } = this.viewMonth();
    return new Date(year, month, 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  });

  readonly calendarCells = computed(() =>
    buildMonthCells(this.viewMonth(), this.minDate, this.maxDate, this.minDate),
  );

  readonly canGoPrevMonth = computed(() => {
    const min = new Date(`${this.minDate}T12:00:00`);
    return (
      monthIndex(this.viewMonth()) > monthIndex({ year: min.getFullYear(), month: min.getMonth() })
    );
  });

  readonly canGoNextMonth = computed(() => {
    const max = new Date(`${this.maxDate}T12:00:00`);
    return (
      monthIndex(this.viewMonth()) < monthIndex({ year: max.getFullYear(), month: max.getMonth() })
    );
  });

  // ── Chips da semana selecionada ──
  readonly weekDays = computed(() =>
    buildWeekDays(this.selectedDate(), this.minDate, this.maxDate, this.minDate),
  );

  /** Existe algum dia selecionável na semana anterior? */
  readonly canGoPrevWeek = computed(() => startOfWeek(this.selectedDate()) > this.minDate);

  /** Existe algum dia selecionável na próxima semana? */
  readonly canGoNextWeek = computed(
    () => addDays(startOfWeek(this.selectedDate()), 7) <= this.maxDate,
  );

  // ── Estado local ──
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
    const pending = this.pendingRestore;
    if (pending) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { date: null, slot: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      if (!this.isSelectableDate(pending.date)) {
        this.pendingRestore = null;
        this.slotNotice.set(RESTORE_UNAVAILABLE_MESSAGE);
      }
    }
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
      .subscribe((slots) => {
        this.slotsForDate.set(slots);
        this.applyPendingRestore(slots);
      });

    this.courtAvailabilitySignalR.reserveStatusChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dto) => this.applyReserveStatusChanged(dto));
  }

  // ── Ações ────────────────────────────────────────────────────────────────

  /** Seleciona a data (nunca antes de hoje nem além da janela) e sincroniza o calendário. */
  selectDate(date: string): void {
    if (date < this.minDate || date > this.maxDate) return;
    this.pendingRestore = null;
    this.slotNotice.set(null);
    this.selectedDate.set(date);
    this.viewMonth.set(this.monthOf(date));
  }

  selectSlot(slot: TimeSlot): void {
    if (!slot.available || this.isConfirming() || this.bookingSuccess()) return;
    this.slotNotice.set(null);
    this.bookingError.set(null);
    this.selectedSlotId.set(slot.id);
  }

  /** Navega o mês exibido no calendário (popover). */
  shiftMonth(delta: -1 | 1): void {
    if ((delta < 0 && !this.canGoPrevMonth()) || (delta > 0 && !this.canGoNextMonth())) return;
    this.viewMonth.update(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  /** Navega a semana dos chips mantendo o mesmo dia da semana (limitado a hoje/janela). */
  shiftWeek(delta: -1 | 1): void {
    if ((delta < 0 && !this.canGoPrevWeek()) || (delta > 0 && !this.canGoNextWeek())) return;

    const target = addDays(this.selectedDate(), delta * 7);
    const clamped =
      target < this.minDate ? this.minDate : target > this.maxDate ? this.maxDate : target;
    this.selectDate(clamped);
  }

  goToToday(): void {
    this.selectDate(this.minDate);
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
      const returnUrl = this.buildReturnUrl();
      this.forceClose();
      this.authRequiredModal.show(
        'Você precisa estar logado para fazer reservas neste clube.',
        returnUrl,
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
  readonly formatDateLong = formatDateLong;

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
  private buildReturnUrl(): string {
    const court = this.court();
    const queryParams: Record<string, string> = { date: this.selectedDate() };
    const slotId = this.selectedSlotId();
    if (slotId) queryParams['slot'] = slotId;

    return this.router.serializeUrl(
      this.router.createUrlTree(['/clubs', court.clubId, 'court', court.id], { queryParams }),
    );
  }

  private readRestoreParams(): { date: string; slotId: string | null } | null {
    const snapshot = this.route.snapshot;
    const date = snapshot.queryParamMap.get('date');
    if (!date || !snapshot.paramMap.get('courtId')) return null;
    return { date, slotId: snapshot.queryParamMap.get('slot') };
  }

  private isSelectableDate(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= this.minDate && date <= this.maxDate;
  }

  private initialDate(): string {
    const pending = this.pendingRestore;
    return pending && this.isSelectableDate(pending.date) ? pending.date : this.minDate;
  }

  private monthOf(date: string): CalendarMonth {
    const d = new Date(`${date}T12:00:00`);
    return { year: d.getFullYear(), month: d.getMonth() };
  }

  /** Só avisa; nunca seleciona o horário sozinho. */
  private applyPendingRestore(slots: TimeSlot[]): void {
    const pending = this.pendingRestore;
    if (!pending || pending.date !== this.selectedDate()) return;
    this.pendingRestore = null;

    if (!pending.slotId) return;
    const slot = slots.find((s) => s.id === pending.slotId);
    if (!slot || !slot.available) this.slotNotice.set(RESTORE_UNAVAILABLE_MESSAGE);
  }
}
