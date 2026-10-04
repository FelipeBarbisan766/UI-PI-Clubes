import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { distinctUntilChanged, finalize, map } from 'rxjs';
import { SurfaceEnum, ResponseCourtDTO } from '../models/model-court';
import { ResponseClubByIdDTO } from '../models/model-club';
import { ServiceClub } from '../services/service-club';
import { AuthService } from '../../../core/services/auth-service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ServiceCourtAvailabilitySignalR } from '../services/service-court-availability-signalr';
import { SportDTO } from '../../../core/models/model-sport';
import { ImageCarousel } from '../../../shared/components/image-carousel/image-carousel';
import { AuthRequiredModalService } from '../../../shared/components/auth-required-modal/auth-required-modal-service';
import { ModalReserve } from './components/modalReserve/modal-reserve';


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

function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function formatPrice(price: number): string {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

function starFillPercent(rating: number | undefined | null, starIndex: number): number {
  const value = rating ?? 0;
  const diff = value - starIndex;
  if (diff >= 1) return 100;
  if (diff <= 0) return 0;
  return diff * 100;
}

@Component({
  selector: 'app-clubs-detail',
  imports: [RouterLink, ImageCarousel, ModalReserve, ModalReserve],
  templateUrl: './clubs-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubsDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clubService = inject(ServiceClub);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly courtAvailabilitySignalR = inject(ServiceCourtAvailabilitySignalR);
  private readonly authRequiredModal = inject(AuthRequiredModalService);
  private readonly location = inject(Location);

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

  /** Quadra aberta automaticamente pela rota (evita reabrir o modal após fechar). */
  private routeOpenedCourtId: string | null = null;

  // ── Estado do clube (delegado ao serviço) ──
  readonly club = this.clubService.selectedClub;
  readonly loading = this.clubService.loading;
  readonly error = this.clubService.error;

  // ── Estado local de UI ──
  readonly selectedCourt = signal<ResponseCourtDTO | null>(null);
  readonly scheduleModalOpen = signal(false);
  readonly isCheckingReview = signal(false);
  readonly isSubmittingReview = signal(false);
  readonly reviewError = signal<string | null>(null);
  readonly selectedRatingValue = signal(0);
  readonly ratingModalOpen = signal(false);
  readonly blockedModalOpen = signal(false);
  readonly blockedModalMessage = signal('');

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

  constructor() {
    effect((onCleanup) => {
      const clubId = this.routeClubId();
      this.selectedCourt.set(null); // evita "vazar" a quadra do clube anterior enquanto carrega
      this.routeOpenedCourtId = null;
      this.scheduleModalOpen.set(false);
      if (!clubId) return;

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
        if (court && this.routeOpenedCourtId !== court.id) {
          this.routeOpenedCourtId = court.id;
          this.scheduleModalOpen.set(true);
        }
      } else if (this.routeOpenedCourtId !== null) {
        // a rota deixou de apontar para uma quadra
        this.routeOpenedCourtId = null;
        this.selectedCourt.set(null);
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

  goBack(event: Event): void {
    if ((window.history.state?.navigationId ?? 0) > 1) {
      event.preventDefault();
      this.location.back();
    }
  }

  loadClub(id?: string): void {
    const clubId = id ?? this.routeClubId();
    if (!clubId) return;
    this.clubService.getById(clubId).subscribe();
  }

  /** Seleciona a quadra e abre o modal de horários/reserva. */
  selectCourt(court: ResponseCourtDTO): void {
    this.selectedCourt.set(court);
    this.scheduleModalOpen.set(true);
  }

  closeScheduleModal(): void {
    this.scheduleModalOpen.set(false);
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
  readonly getFirstImage = getFirstImage;
  readonly getSurfaceName = getSurfaceName;
  readonly sportsLabel = sportsLabel;
}