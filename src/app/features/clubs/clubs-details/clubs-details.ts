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
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage, NgClass } from '@angular/common';
import { EMPTY, catchError, distinctUntilChanged, map, switchMap } from 'rxjs';
import { TypeEnum, SurfaceEnum, ResponseCourtDTO } from '../models/model-court';
import { ResponseClubByIdDTO } from '../models/model-club';
import { ServiceClub } from '../services/service-club';
import { ServiceSchedule } from '../services/service-schedule';
import { ServiceReserve } from '../services/service-reserve';
import { ScheduleAvailabilityDTO } from '../models/model-schedule';
import { AuthService } from '../../../core/services/auth-service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const TYPE_LABELS: Record<TypeEnum, string> = {
  [TypeEnum.None]: 'Outro',
  [TypeEnum.Futsal]: 'Futsal',
  [TypeEnum.Basquetebol]: 'Basquetebol',
  [TypeEnum.Basquete]: 'Basquete',
  [TypeEnum.Voleibol]: 'Vôlei',
  [TypeEnum.VôleiSentado]: 'Vôlei Sentado',
  [TypeEnum.Handebol]: 'Handebol',
  [TypeEnum.Netball]: 'Netball',
  [TypeEnum.Tênis]: 'Tênis',
  [TypeEnum.Badminton]: 'Badminton',
  [TypeEnum.Squash]: 'Squash',
  [TypeEnum.Padel]: 'Padel',
  [TypeEnum.Pickleball]: 'Pickleball',
  [TypeEnum.TênisDeMesa]: 'Tênis de Mesa',
  [TypeEnum.Judô]: 'Judô',
  [TypeEnum.Karatê]: 'Karatê',
  [TypeEnum.Taekwondo]: 'Taekwondo',
  [TypeEnum.Esgrima]: 'Esgrima',
  [TypeEnum.SepakTakraw]: 'Sepak Takraw',
  [TypeEnum.Hóquei]: 'Hóquei',
  [TypeEnum.Dodgeball]: 'Dodgeball',
  [TypeEnum.Raquetebol]: 'Raquetebol',
  [TypeEnum.PelotaBasca]: 'Pelota Basca',
  [TypeEnum.Floorball]: 'Floorball',
  [TypeEnum.Korfball]: 'Korfball',
  [TypeEnum.Tchoukball]: 'Tchoukball',
  [TypeEnum.Goalball]: 'Goalball',
  [TypeEnum.Futebol]: 'Futebol',
};

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

function getTypeName(type: TypeEnum): string {
  return TYPE_LABELS[type] ?? 'Outro';
}

function getSurfaceName(surface: SurfaceEnum): string {
  return SURFACE_LABELS[surface] ?? 'Outro';
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

/**
 * Mapeia os DTOs da API para o formato interno TimeSlot.
 * O .NET serializa TimeOnly como "HH:mm:ss", então fazemos slice(0,5).
 */
function mapAvailabilityToSlots(dtos: ScheduleAvailabilityDTO[], date: string): TimeSlot[] {
  return dtos.map(dto => ({
    id:        dto.id,
    date,
    startTime: dto.startTime.slice(0, 5),
    endTime:   dto.endTime.slice(0, 5),
    available: dto.isAvailable,
    fixed:     dto.isBlocked,
  }));
}

// ── View model ───────────────────────────────────────────────────────────────

/** Representa um slot de horário para exibição no template. */
export interface TimeSlot {
  id:        string;
  date:      string;      // 'YYYY-MM-DD'
  startTime: string;      // 'HH:mm'
  endTime:   string;      // 'HH:mm'
  available: boolean;     // isAvailable da API
  fixed:     boolean;     // isBlocked da API (horário fixo ocupado)
}

// ── Componente ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-clubs-detail',
  imports: [NgOptimizedImage, RouterLink, NgClass],
  templateUrl: './clubs-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubsDetail {
  private readonly route           = inject(ActivatedRoute);
  private readonly router          = inject(Router);
  private readonly clubService     = inject(ServiceClub);
  private readonly scheduleService = inject(ServiceSchedule);
  private readonly reserveService  = inject(ServiceReserve);
  private readonly authService     = inject(AuthService);
  private readonly destroyRef      = inject(DestroyRef);
  private readonly sanitizer       = inject(DomSanitizer);

  private readonly routeClubId = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('clubId')),
      distinctUntilChanged(),
    ),
    { initialValue: this.route.snapshot.paramMap.get('clubId') },
  );

  // ── Estado do clube (delegado ao serviço) ──
  readonly club    = this.clubService.selectedClub;
  readonly loading = this.clubService.loading;
  readonly error   = this.clubService.error;

  // ── Estado dos slots (delegado ao serviço) ──
  readonly slotsLoading = this.scheduleService.loading;
  readonly slotsError   = this.scheduleService.error;

  // ── Estado local de UI ──
  readonly selectedCourt    = signal<ResponseCourtDTO | null>(null);
  readonly selectedDate     = signal<string>('');
  readonly availableDates   = signal<string[]>([]);
  readonly slotsForDate     = signal<TimeSlot[]>([]);
  readonly bookingSlot      = signal<TimeSlot | null>(null);
  readonly bookingModalOpen = signal(false);

  // ── Estado do fluxo de confirmação ──
  readonly isConfirming  = signal(false);
  readonly bookingError  = signal<string | null>(null);
  readonly bookingSuccess = signal(false);

  /** Tipos únicos de todas as quadras do clube (usado na sidebar). */
  readonly courtTypes = computed(() =>
    [...new Set(this.club()?.courts.map(c => c.type) ?? [])]
  );

  /**
   * Sinal derivado que combina quadra + data selecionadas.
   * Serve de gatilho reativo para o carregamento de slots.
   */
  private readonly courtAndDate = computed(() => ({
    court: this.selectedCourt(),
    date:  this.selectedDate(),
  }));

  constructor() {
    // 1️⃣ Carrega o clube quando o parâmetro de rota muda.
    effect((onCleanup) => {
      const clubId = this.routeClubId();
      if (!clubId) {
        this.resetCourtSelection();
        return;
      }
      this.resetCourtSelection();
      const subscription = this.clubService.getById(clubId).subscribe();
      onCleanup(() => subscription.unsubscribe());
    });

    // 2️⃣ Reconstrói a lista de datas disponíveis quando uma quadra é selecionada.
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

    // 3️⃣ Busca os slots na API sempre que quadra ou data mudam.
    //    switchMap garante que requisições anteriores são canceladas automaticamente.
    toObservable(this.courtAndDate)
      .pipe(
        switchMap(({ court, date }) => {
          this.slotsForDate.set([]);
          this.bookingSlot.set(null);

          if (!court || !date) return EMPTY;

          return this.scheduleService.getAvailability(court.id, date).pipe(
            map(dtos => mapAvailabilityToSlots(dtos, date)),
            // O erro já é tratado (e exibido via slotsError) dentro do serviço.
            // Aqui apenas evitamos que o stream externo quebre.
            catchError(() => EMPTY),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(slots => this.slotsForDate.set(slots));
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
    // Usuário não autenticado → redireciona para login preservando a rota atual
    if (!this.authService.isAuthenticated()) {
      this.closeBookingModal();
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const slot = this.bookingSlot();
    if (!slot) return;

    this.isConfirming.set(true);
    this.bookingError.set(null);

    // 1️⃣ Busca o perfil do jogador para obter o playerId
    // 2️⃣ Com o playerId em mãos, cria a reserva
    this.authService.getPlayerMe().pipe(
      switchMap(player =>
        this.reserveService.create({
          date:       `${slot.date}T00:00:00`,
          scheduleId: slot.id,
          playerId:   player.id,
        })
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isConfirming.set(false);
        this.bookingSuccess.set(true);
      },
      error: (err: Error) => {
        this.isConfirming.set(false);
        this.bookingError.set(err.message);
      },
    });
  }

  // ── Helpers expostos ao template ─────────────────────────────────────────

  readonly sanitizePhone  = sanitizePhone;
  readonly formatPrice    = formatPrice;
  readonly formatDate     = formatDate;
  readonly getFirstImage  = getFirstImage;
  readonly getTypeName    = getTypeName;
  readonly getSurfaceName = getSurfaceName;

  // ── Helpers privados ─────────────────────────────────────────────────────

  private resetCourtSelection(): void {
    this.selectedCourt.set(null);
    this.selectedDate.set('');
    this.availableDates.set([]);
    this.slotsForDate.set([]);
    this.bookingSlot.set(null);
    this.bookingModalOpen.set(false);
    this.bookingError.set(null);
    this.bookingSuccess.set(false);
    this.isConfirming.set(false);
  }
}