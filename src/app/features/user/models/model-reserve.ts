// ── API response shape (espelha ResponseReserveDetailDTO do backend) ─────────

export interface ApiReservation {
  id: string;
  date: string;
  status: string;
  canCancel: boolean;   // novo
  club: Club;
  schedule: Schedule;
}



export interface Club {
  name: string;
  phoneNumber: string;
}

export interface Schedule {
  startTime: string;
  endTime: string;
  price: number; // preço do horário
  court: Court;
}

export interface Court {
  name: string;
  type: string;
}

export enum StatusEnum {
  Cancelada = 'Cancelada',
  Confirmada = 'Confirmada',
}

export interface Reservation {
  id: string;
  club: string;
  phone: string;
  court: string;
  date: string;
  time: string;
  status: StatusEnum;
  canCancel: boolean;  
  price: number;
}

export interface ReserveQueryParams {
  page: number;
  pageSize: number;
  name?: string;
  status?: StatusEnum;
}

export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}