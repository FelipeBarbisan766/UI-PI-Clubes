// ── API response shape (espelha ResponseReserveDetailDTO do backend) ─────────

export interface ApiReservation {
  id: string;
  date: string;       
  status: string;     
  club: Club;
  schedule: Schedule;
}

export interface Club {
  name: string;
  phoneNumber: string;
}

export interface Schedule {
  startTime: string;  
  endTime:   string;
  court:     Court;
}

export interface Court {
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
  club:   string;
  phone: string;
  court:  string;
  date:   string; 
  time:   string; 
  status: StatusEnum;
  pricePerHour:  number;
}
