// ── API response shape (espelha ResponseReserveDetailDTO do backend) ─────────

export interface ApiReservation {
  id: string;
  date: string;       // DateTime → "2026-03-03T00:00:00"
  status: string;     // StatusEnum como string: "Pending" | "Confirmed" | "Cancelled"
  player: ApiPlayer;
  schedule: ApiSchedule;
}

export interface ApiPlayer {
  name: string;
}

export interface ApiSchedule {
  startTime: string;  // TimeOnly → "HH:mm:ss"
  endTime:   string;
  court:     ApiCourt;
}

export interface ApiCourt {
  name:  string;
  pricePerHour: number;
  type:  string;
}

// ── View model (usado no componente) ─────────────────────────────────────────

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id:     string;
  player: string;
  court:  string;
  date:   string; // "YYYY-MM-DD"
  time:   string; // "HH:mm – HH:mm"
  status: ReservationStatus;
  pricePerHour:  number;
}

// ── Mapeamento StatusEnum (PascalCase C#) → union type local ─────────────────

export const STATUS_MAP: Record<string, ReservationStatus> = {
  Pending:   'pending',
  Confirmed: 'confirmed',
  Cancelled: 'cancelled',
};