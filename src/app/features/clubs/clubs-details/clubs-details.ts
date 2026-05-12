import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { TypeEnum, SurfaceEnum, ResponseCourtDTO } from '../models/model-court';
import { ResponseClubByIdDTO } from '../models/model-club';
import { ServiceClub } from '../services/service-club';

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
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './clubs-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubsDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clubService  = inject(ServiceClub);
  // private readonly scheduleService = inject(ServiceSchedule); // serviço de slots (a implementar)

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

  // --- Lifecycle ---
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('clubId');
    console.log(id);
    if (id) this.loadClub(id);
  }

  loadClub(id?: string): void {
    const clubId = id ?? this.route.snapshot.paramMap.get('id')!;
    this.clubService.getById(clubId).subscribe()
  }

  // --- Court & slot selection ---
  selectCourt(court: ResponseCourtDTO): void {
    this.selectedCourt.set(court);
    this.selectedDate.set('');
    this.slotsForDate.set([]);
    // Carregue as datas disponíveis via scheduleService (a implementar)
    // this.scheduleService.getAvailableDates(court.id).subscribe(dates => {
    //   this.availableDates.set(dates);
    //   if (dates.length) this.selectDate(dates[0]);
    // });
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.bookingSlot.set(null);
    // Carregue os slots via scheduleService (a implementar)
    // this.scheduleService.getSlots(this.selectedCourt()!.id, date).subscribe(slots => {
    //   this.slotsForDate.set(slots);
    // });
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

  // --- Helpers ---
  getFirstImage(): string | null {
    const imgs = this.club()?.imagesUrls;
    return imgs?.length ? imgs[0] : null;
  }

  sanitizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // --- TypeEnum labels ---
  private readonly typeLabels: Record<TypeEnum, string> = {
    [TypeEnum.None]: 'Outro', [TypeEnum.Futsal]: 'Futsal',
    [TypeEnum.Basquetebol]: 'Basquetebol', [TypeEnum.Basquete]: 'Basquete',
    [TypeEnum.Voleibol]: 'Vôlei', [TypeEnum.VôleiSentado]: 'Vôlei Sentado',
    [TypeEnum.Handebol]: 'Handebol', [TypeEnum.Netball]: 'Netball',
    [TypeEnum.Tênis]: 'Tênis', [TypeEnum.Badminton]: 'Badminton',
    [TypeEnum.Squash]: 'Squash', [TypeEnum.Padel]: 'Padel',
    [TypeEnum.Pickleball]: 'Pickleball', [TypeEnum.TênisDeMesa]: 'Tênis de Mesa',
    [TypeEnum.Judô]: 'Judô', [TypeEnum.Karatê]: 'Karatê',
    [TypeEnum.Taekwondo]: 'Taekwondo', [TypeEnum.Esgrima]: 'Esgrima',
    [TypeEnum.SepakTakraw]: 'Sepak Takraw', [TypeEnum.Hóquei]: 'Hóquei',
    [TypeEnum.Dodgeball]: 'Dodgeball', [TypeEnum.Raquetebol]: 'Raquetebol',
    [TypeEnum.PelotaBasca]: 'Pelota Basca', [TypeEnum.Floorball]: 'Floorball',
    [TypeEnum.Korfball]: 'Korfball', [TypeEnum.Tchoukball]: 'Tchoukball',
    [TypeEnum.Goalball]: 'Goalball', [TypeEnum.Futebol]: 'Futebol',
  };

  getTypeName(type: TypeEnum): string {
    return this.typeLabels[type] ?? 'Outro';
  }

  // --- SurfaceEnum labels ---
  private readonly surfaceLabels: Record<SurfaceEnum, string> = {
    [SurfaceEnum.None]: 'Outro', [SurfaceEnum.Saibro]: 'Saibro',
    [SurfaceEnum.PisoDuro]: 'Piso Duro', [SurfaceEnum.GramaNatural]: 'Grama Natural',
    [SurfaceEnum.GramaSintética]: 'Grama Sintética', [SurfaceEnum.Madeira]: 'Madeira',
    [SurfaceEnum.PisoVinílico]: 'Piso Vinílico', [SurfaceEnum.PisoAcrílico]: 'Piso Acrílico',
    [SurfaceEnum.PisoEmborrachado]: 'Piso Emborrachado', [SurfaceEnum.Areia]: 'Areia',
    [SurfaceEnum.Carpete]: 'Carpete', [SurfaceEnum.Asfalto]: 'Asfalto',
    [SurfaceEnum.TerraBatida]: 'Terra Batida', [SurfaceEnum.PisoModular]: 'Piso Modular',
  };

  getSurfaceName(surface: SurfaceEnum): string {
    return this.surfaceLabels[surface] ?? 'Outro';
  }
}
