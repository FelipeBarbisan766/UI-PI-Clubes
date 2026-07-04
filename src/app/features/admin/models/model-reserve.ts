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

export enum StatusEnum {
  Pendente = 'AguardandoConfirmacao',
  Confirmada = 'Confirmada',
  Recusada = 'Recusada'
}

export interface Reservation {
  id:     string;
  player: string;
  court:  string;
  date:   string; // "YYYY-MM-DD"
  time:   string; // "HH:mm – HH:mm"
  status: StatusEnum;
  pricePerHour:  number;
}
