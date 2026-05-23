import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id: string;
  player: string;
  phone: string;
  court: string;
  date: string;
  time: string;
  status: ReservationStatus;
  price: number;
}

interface StatusConfig {
  label: string;
  badgeClass: string;
}

const STATUS_CONFIG: Record<ReservationStatus, StatusConfig> = {
  pending:   { label: 'Pendente',   badgeClass: 'badge-warning'  },
  confirmed: { label: 'Confirmada', badgeClass: 'badge-success'  },
  cancelled: { label: 'Cancelada',  badgeClass: 'badge-error'    },
};

const MOCK_RESERVATIONS: Reservation[] = [
  { id: 'r1', player: 'João Silva',     phone: '5511999990001', court: 'Quadra 1 - Futsal',       date: '2026-03-03', time: '18:00 - 19:00', status: 'pending',   price: 150 },
  { id: 'r2', player: 'Maria Santos',   phone: '5511999990002', court: 'Quadra 2 - Vôlei',        date: '2026-03-03', time: '19:00 - 20:00', status: 'confirmed', price: 120 },
  { id: 'r3', player: 'Pedro Costa',    phone: '5511999990003', court: 'Quadra 3 - Beach Tennis', date: '2026-03-04', time: '10:00 - 11:00', status: 'confirmed', price: 100 },
  { id: 'r4', player: 'Ana Lima',       phone: '5511999990004', court: 'Quadra 1 - Futsal',       date: '2026-03-04', time: '14:00 - 15:00', status: 'pending',   price: 150 },
  { id: 'r5', player: 'Carlos Souza',   phone: '5511999990005', court: 'Quadra 2 - Vôlei',        date: '2026-03-05', time: '16:00 - 17:00', status: 'cancelled', price: 120 },
  { id: 'r6', player: 'Fernanda Dias',  phone: '5511999990006', court: 'Quadra 1 - Futsal',       date: '2026-03-05', time: '20:00 - 21:00', status: 'pending',   price: 150 },
];

@Component({
  selector: 'app-reserve',
  templateUrl: './reserves.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class Reserve {
  protected readonly reservations = signal<Reservation[]>(MOCK_RESERVATIONS);

  protected readonly searchControl    = new FormControl('', { nonNullable: true });
  protected readonly filterControl    = new FormControl<'all' | ReservationStatus>('all', { nonNullable: true });

  private readonly search$     = toSignal(this.searchControl.valueChanges,     { initialValue: '' });
  private readonly filterStatus$ = toSignal(this.filterControl.valueChanges,   { initialValue: 'all' as const });

  protected readonly filtered = computed(() => {
    const query  = this.search$().toLowerCase();
    const status = this.filterStatus$();

    return this.reservations().filter(r => {
      const matchSearch = r.player.toLowerCase().includes(query)
                       || r.court.toLowerCase().includes(query);
      const matchStatus = status === 'all' || r.status === status;
      return matchSearch && matchStatus;
    });
  });

  protected readonly pendingCount = computed(
    () => this.reservations().filter(r => r.status === 'pending').length
  );

  protected readonly statusConfig = STATUS_CONFIG;

  protected confirm(id: string): void {
    this.reservations.update(list =>
      list.map(r => r.id === id ? { ...r, status: 'confirmed' as const } : r)
    );
  }

  protected cancel(id: string): void {
    this.reservations.update(list =>
      list.map(r => r.id === id ? { ...r, status: 'cancelled' as const } : r)
    );
  }

  protected formatDate(dateStr: string): string {
    const d = new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  protected formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected openWhatsApp(phone: string): void {
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  }

  protected trackById(_index: number, item: Reservation): string {
    return item.id;
  }
}