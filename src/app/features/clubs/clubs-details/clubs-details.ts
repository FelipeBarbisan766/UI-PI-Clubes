import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  Signal,
  signal,
  Injector,
  afterNextRender,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage, NgClass, ViewportScroller } from '@angular/common';
import { EMPTY, catchError, distinctUntilChanged, finalize, map, switchMap } from 'rxjs';
import { SurfaceEnum, ResponseCourtDTO } from '../models/model-court';
import { ResponseClubByIdDTO } from '../models/model-club';
import { ServiceClub } from '../services/service-club';
import { ServiceSchedule } from '../services/service-schedule';
import { ServiceReserve } from '../services/service-reserve';
import { ScheduleAvailabilityDTO } from '../models/model-schedule';
import { AuthService } from '../../../core/services/auth-service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ServiceCourtAvailabilitySignalR } from '../services/service-court-availability-signalr';
import { ReserveAvailabilityChangedDTO } from '../models/model-reserve';
import { SportDTO } from '../../../core/models/model-sport';
import { ImageCarousel } from '../../../shared/components/image-carousel/image-carousel';
import { Footer } from '../../../shared/footer/footer';
import { AuthRequiredModalService } from '../../../shared/components/auth-required-modal/auth-required-modal-service';

const SURFACE_LABELS: Record<SurfaceEnum, string> = {
  [SurfaceEnum.None]: 'Outro',
  [SurfaceEnum.Saibro]: 'Saibro',
  [SurfaceEnum.PisoDuro]: 'Piso Duro',
  [SurfaceEnum.GramaNatural]: 'Grama Natural',
  [SurfaceEnum.GramaSintética]: 'Grama Sintética',
  [SurfaceEnum.Madeira]: 'Madeira',
  [SurfaceEnum.PisoVinílico]: 'Piso Vinílico',
  [SurfaceEnum.PisoAcrílico]: 'Piso Acrílico',
  [SurfaceEnum.PisoEmborrachado]: 'Piso Emborrachado',
  [SurfaceEnum.Areia]: 'Areia',
  [SurfaceEnum.Carpete]: 'Carpete',
  [SurfaceEnum.Asfalto]: 'Asfalto',
  [SurfaceEnum.TerraBatida]: 'Terra Batida',
  [SurfaceEnum.PisoModular]: 'Piso Modular',
};

// ── Funções puras ────────────────────────────────────────────────────────────

const UNAVAILABLE_STATUSES = new Set<string>(['AguardandoConfirmacao', 'Confirmada', 'Recusada']);

function isSlotAvailableForStatus(status: string): boolean {
  return !UNAVAILABLE_STATUSES.has(status);
}

function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
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

function getFirstImage(club: ResponseClubByIdDTO | null): string | null {
  const images = club?.images;
  return images?.length ? images[0].fullUrl : null;
}

function getSurfaceName(surface: SurfaceEnum): string {
  return SURFACE_LABELS[surface] ?? 'Outro';
}

function sportsLabel(court: ResponseCourtDTO): string {
  return court.sports.map((s) => s.name).join(', ') || 'Sem modalidade';
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
function starFillPercent(rating: number | undefined | null, starIndex: number): number {
  const value = rating ?? 0;
  const diff = value - starIndex;
  if (diff >= 1) return 100;
  if (diff <= 0) return 0;
  return diff * 100;
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

@Component({
  selector: 'app-clubs-detail',
  imports: [RouterLink, NgClass, ImageCarousel, Footer],
  templateUrl: './clubs-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubsDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clubService = inject(ServiceClub);
  private readonly scheduleService = inject(ServiceSchedule);
  private readonly reserveService = inject(ServiceReserve);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly injector = inject(Injector);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly courtAvailabilitySignalR = inject(ServiceCourtAvailabilitySignalR);
  private readonly authRequiredModal = inject(AuthRequiredModalService);

  readonly starIndexes = [0, 1, 2, 3, 4] as const;

  private readonly routeClubId = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('clubId')),
      distinctUntilChanged(),
    ),
    { initialValue: this.route.snapshot.paramMap.get('clubId') },
  );

  private readonly routeCourtId = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('courtId')),
      distinctUntilChanged(),
    ),
    { initialValue: this.route.snapshot.paramMap.get('courtId') },
  );

  // ── Estado do clube (delegado ao serviço) ──
  readonly club = this.clubService.selectedClub;
  readonly loading = this.clubService.loading;
  readonly error = this.clubService.error;

  // ── Estado dos slots (delegado ao serviço) ──
  readonly slotsLoading = this.scheduleService.loading;
  readonly slotsError = this.scheduleService.error;

  // ── Estado local de UI ──
  readonly selectedCourt = signal<ResponseCourtDTO | null>(null);
  readonly selectedDate = signal<string>('');
  readonly availableDates = signal<string[]>([]);
  readonly slotsForDate = signal<TimeSlot[]>([]);
  readonly bookingSlot = signal<TimeSlot | null>(null);
  readonly bookingModalOpen = signal(false);
  readonly isCheckingReview = signal(false);
  readonly isSubmittingReview = signal(false);
  readonly reviewError = signal<string | null>(null);
  readonly selectedRatingValue = signal(0);
  readonly ratingModalOpen = signal(false);
  readonly blockedModalOpen = signal(false);
  readonly blockedModalMessage = signal('');

  // ── Estado do fluxo de confirmação ──
  readonly isConfirming = signal(false);
  readonly bookingError = signal<string | null>(null);
  readonly bookingSuccess = signal(false);

  /** Modalidades únicas de todas as quadras do clube (usado na sidebar). */
  readonly courtSports = computed<SportDTO[]>(() => {
    const courts = this.club()?.courts ?? [];
    const unique = new Map<string, SportDTO>();
    for (const court of courts) {
      for (const sport of court.sports) {
        unique.set(sport.id, sport);
      }
    }
    return [...unique.values()];
  });

  readonly starFillPercent = starFillPercent;

  private readonly courtAndDate = computed(() => ({
    court: this.selectedCourt(),
    date: this.selectedDate(),
  }));

  constructor() {
    effect((onCleanup) => {
      const clubId = this.routeClubId();
      if (!clubId) {
        this.selectedCourt.set(null);
        this.resetBookingUiState();
        return;
      }
      this.selectedCourt.set(null); // evita "vazar" a quadra do clube anterior enquanto carrega
      this.resetBookingUiState();
      const subscription = this.clubService.getById(clubId).subscribe();
      onCleanup(() => subscription.unsubscribe());
    });

    effect(() => {
      const club = this.club();
      const courtId = this.routeCourtId();
      if (!club) return;

      if (courtId) {
        const court = club.courts.find((c) => c.id === courtId) ?? null;
        this.selectedCourt.set(court);
        if (court) {
          this.scrollToSchedule();
        }
      } else {
        this.selectedCourt.set(null);
      }
    });

    effect(() => {
      const court = this.selectedCourt();
      if (!court) {
        this.availableDates.set([]);
        this.selectedDate.set('');
        this.bookingSlot.set(null);
        return;
      }

      const dates = buildAvailableDates();
      this.availableDates.set(dates);

      const currentDate = this.selectedDate();
      if (!currentDate || !dates.includes(currentDate)) {
        this.selectedDate.set(dates[0] ?? '');
      }
    });

    effect((onCleanup) => {
      const clubId = this.routeClubId();
      if (!clubId) return;

      this.courtAvailabilitySignalR
        .joinClub(clubId)
        .catch((err) => console.error('[SignalR] Falha ao entrar no grupo do clube:', err));

      onCleanup(() => {
        this.courtAvailabilitySignalR
          .leaveClub(clubId)
          .catch((err) => console.error('[SignalR] Falha ao sair do grupo do clube:', err));
      });
    });

    this.courtAvailabilitySignalR.reserveStatusChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dto) => {
        this.applyReserveStatusChanged(dto);
      });

    toObservable(this.courtAndDate)
      .pipe(
        switchMap(({ court, date }) => {
          this.slotsForDate.set([]);
          this.bookingSlot.set(null);

          if (!court || !date) return EMPTY;

          return this.scheduleService.getAvailability(court.id, date).pipe(
            map((dtos) => mapAvailabilityToSlots(dtos, date)),
            catchError(() => EMPTY),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((slots) => this.slotsForDate.set(slots));
  }

  // ── URL do mapa ──────────────────────────────────────────────────────────

  readonly mapUrl: Signal<SafeResourceUrl | null> = computed(() => {
    const c = this.club();
    if (!c) return null;

    const enderecoCompleto = [
      `${c.street}, ${c.number}`,
      c.neighborhood,
      `${c.city} - ${c.state}`,
    ].join(', ');

    const url = `https://maps.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // ── Ações ────────────────────────────────────────────────────────────────

  loadClub(id?: string): void {
    const clubId = id ?? this.routeClubId();
    if (!clubId) return;
    this.clubService.getById(clubId).subscribe();
  }

  selectCourt(court: ResponseCourtDTO): void {
    this.selectedCourt.set(court);
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  openBookingModal(slot: TimeSlot): void {
    this.bookingSlot.set(slot);
    this.bookingError.set(null);
    this.bookingSuccess.set(false);
    this.bookingModalOpen.set(true);
  }

  closeBookingModal(): void {
    this.bookingModalOpen.set(false);
    this.bookingError.set(null);
    this.bookingSuccess.set(false);
    this.isConfirming.set(false);
  }

  confirmBooking(): void {
   
    if (!this.authService.isAuthenticated()) {
      this.closeBookingModal();
      this.authRequiredModal.show(
        'Você precisa estar logado para fazer reservas neste clube.',
        this.router.url,
      );
      return;
    }

    if (this.authService.needsCompleteProfile()) {
      this.closeBookingModal();
      this.router.navigate(['/complete-profile']);
      return;
    }

    const slot = this.bookingSlot();
    if (!slot) return;

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

  private markSlotUnavailable(scheduleId: string): void {
    this.slotsForDate.update((slots) =>
      slots.map((s) => (s.id === scheduleId ? { ...s, available: false } : s)),
    );
  }

  openRateFlow(): void {
    if (this.isCheckingReview()) return;

    if (!this.authService.isAuthenticated()) {
      this.authRequiredModal.show(
        'Você precisa estar logado para avaliar este clube.',
        this.router.url,
      );
      return;
    }

    const clubId = this.routeClubId();
    if (!clubId) return;

    this.isCheckingReview.set(true);

    this.clubService
      .hasReviewed(clubId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isCheckingReview.set(false)),
      )
      .subscribe({
        next: (alreadyReviewed) => {
          if (alreadyReviewed) {
            this.openBlockedModal(
              'Você já avaliou este clube. Cada jogador pode avaliar apenas uma vez.',
            );
            return;
          }
          this.openRatingModal();
        },
        error: () => {
          this.openBlockedModal('Não foi possível verificar sua avaliação agora. Tente novamente.');
        },
      });
  }
  
  openRatingModal(): void {
    this.selectedRatingValue.set(0);
    this.reviewError.set(null);
    this.ratingModalOpen.set(true);
  }

  closeRatingModal(): void {
    if (this.isSubmittingReview()) return;
    this.ratingModalOpen.set(false);
  }

  setRatingValue(value: number): void {
    this.selectedRatingValue.set(value);
  }

  submitReview(): void {
    const clubId = this.routeClubId();
    const rating = this.selectedRatingValue();
    if (!clubId || rating <= 0 || this.isSubmittingReview()) return;

    this.isSubmittingReview.set(true);
    this.reviewError.set(null);

    this.clubService
      .rate(clubId, rating)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmittingReview.set(false)),
      )
      .subscribe({
        next: (summary) => {
          this.clubService.applyReviewSummary(summary);
          this.ratingModalOpen.set(false);
        },
        error: (err: Error) => this.reviewError.set(err.message),
      });
  }

  private openBlockedModal(message: string): void {
    this.blockedModalMessage.set(message);
    this.blockedModalOpen.set(true);
  }

  closeBlockedModal(): void {
    this.blockedModalOpen.set(false);
  }

  // ── Helpers expostos ao template ─────────────────────────────────────────

  readonly sanitizePhone = sanitizePhone;
  readonly formatPrice = formatPrice;
  readonly formatDate = formatDate;
  readonly getFirstImage = getFirstImage;
  readonly getSurfaceName = getSurfaceName;
  readonly sportsLabel = sportsLabel;

  // ── Helpers privados ─────────────────────────────────────────────────────

  private applyReserveStatusChanged(dto: ReserveAvailabilityChangedDTO): void {
    const eventDate = dto.date.slice(0, 10);
    if (eventDate !== this.selectedDate()) return;

    this.slotsForDate.update((slots) =>
      slots.map((slot) =>
        slot.id === dto.scheduleId
          ? { ...slot, available: isSlotAvailableForStatus(dto.status) }
          : slot,
      ),
    );
  }

  private resetBookingUiState(): void {
    this.selectedDate.set('');
    this.availableDates.set([]);
    this.slotsForDate.set([]);
    this.bookingSlot.set(null);
    this.bookingModalOpen.set(false);
    this.bookingError.set(null);
    this.bookingSuccess.set(false);
    this.isConfirming.set(false);
  }
  private scrollToSchedule(): void {
    afterNextRender(() => this.viewportScroller.scrollToAnchor('slots-section'), {
      injector: this.injector,
    });
  }
}
