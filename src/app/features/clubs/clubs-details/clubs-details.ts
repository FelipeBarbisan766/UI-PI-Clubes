import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage, NgClass } from '@angular/common';
import { TypeEnum, SurfaceEnum, ResponseCourtDTO } from '../models/model-court';
import { ResponseClubByIdDTO } from '../models/model-club';
import { ServiceClub } from '../services/service-club';
import { distinctUntilChanged, map } from 'rxjs';

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
  const images = club?.imagesUrls;
  return images?.length ? images[0] : null;
}

function getTypeName(type: TypeEnum): string {
  return TYPE_LABELS[type] ?? 'Outro';
}

function getSurfaceName(surface: SurfaceEnum): string {
  return SURFACE_LABELS[surface] ?? 'Outro';
}

function buildAvailableDates(days = 7): string[] {
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  });
}

function buildStubSlots(courtId: string, date: string): TimeSlot[] {
  const hours = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  return hours.map((startTime, index) => {
    const endHour = Number(startTime.slice(0, 2)) + 1;
    const endTime = `${String(endHour).padStart(2, '0')}:00`;
    const isBlockedByFixedSchedule = index % 4 === 0;
    const isReserved = index % 5 === 0;
    const available = !isBlockedByFixedSchedule && !isReserved;
    return {
      id: `${courtId}-${date}-${startTime}`,
      date,
      startTime,
      endTime,
      available,
      fixed: isBlockedByFixedSchedule,
    };
  });
}

// ⚠️ Defina TimeSlot conforme o contrato da sua API de slots
export interface TimeSlot {
  id: string;
  date: string;        // 'YYYY-MM-DD'
  startTime: string;   // 'HH:mm'
  endTime: string;     // 'HH:mm'
  available: boolean;
  fixed: boolean;
}

@Component({
  selector: 'app-clubs-detail',
  imports: [NgOptimizedImage, RouterLink, NgClass],
  templateUrl: './clubs-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubsDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly clubService = inject(ServiceClub);
  // private readonly scheduleService = inject(ServiceSchedule); // serviço de slots (a implementar)
  private readonly routeClubId = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('clubId')),
      distinctUntilChanged(),
    ),
    { initialValue: this.route.snapshot.paramMap.get('clubId') },
  );

  // --- State (loading/error delegados ao serviço, igual ao clubs-list) ---
  readonly club    = this.clubService.selectedClub;
  readonly loading = this.clubService.loading;
  readonly error   = this.clubService.error;

  readonly selectedCourt    = signal<ResponseCourtDTO | null>(null);
  readonly selectedDate     = signal<string>('');
  readonly availableDates   = signal<string[]>([]);
  readonly slotsForDate     = signal<TimeSlot[]>([]);
  readonly bookingSlot      = signal<TimeSlot | null>(null);
  readonly bookingModalOpen = signal(false);

  // Tipos únicos de todas as quadras (para a sidebar)
  readonly courtTypes = computed(() =>
    [...new Set(this.club()?.courts.map(c => c.type) ?? [])]
  );

  constructor() {
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

    effect(() => {
      const court = this.selectedCourt();
      const date = this.selectedDate();
      if (!court || !date) {
        this.slotsForDate.set([]);
        return;
      }

      // Stub temporário até integrar o scheduleService.
      this.slotsForDate.set(buildStubSlots(court.id, date));
      this.bookingSlot.set(null);
    });
  }

  loadClub(id?: string): void {
    const clubId = id ?? this.routeClubId();
    if (!clubId) {
      return;
    }
    this.clubService.getById(clubId).subscribe();
  }

  // --- Court & slot selection ---
  selectCourt(court: ResponseCourtDTO): void {
    this.selectedCourt.set(court);
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  // --- Booking modal ---
  openBookingModal(slot: TimeSlot): void {
    this.bookingSlot.set(slot);
    this.bookingModalOpen.set(true);
  }

  closeBookingModal(): void {
    this.bookingModalOpen.set(false);
  }

  confirmBooking(): void {
    // this.clubService.createBooking({ ... }).subscribe(() => { ... });
    this.closeBookingModal();
  }

  readonly sanitizePhone = sanitizePhone;
  readonly formatPrice = formatPrice;
  readonly formatDate = formatDate;
  readonly getFirstImage = getFirstImage;
  readonly getTypeName = getTypeName;
  readonly getSurfaceName = getSurfaceName;

  private resetCourtSelection(): void {
    this.selectedCourt.set(null);
    this.selectedDate.set('');
    this.availableDates.set([]);
    this.slotsForDate.set([]);
    this.bookingSlot.set(null);
    this.bookingModalOpen.set(false);
  }
}
