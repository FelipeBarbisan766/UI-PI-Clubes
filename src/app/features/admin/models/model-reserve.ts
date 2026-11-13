// ── API response shape (espelha ResponseReserveDetailDTO do backend) ─────────

import { SportDTO } from "../../../core/models/model-sport";

export interface ResponseReserveDetailDTO {
  id: string;
  date: string; 
  status: StatusEnum; 
  name: string;
  phoneNumber: string;
  userId: string;
  canCancel: boolean;   
  dateOfReservation: string;
  schedule: ApiSchedule;
}

export interface ApiPlayer {
  name: string;
}

export interface ApiSchedule {
  startTime: string;
  endTime: string;
  price: number;       
  court: ApiCourt;
}

export interface ApiCourt {
  name: string;
  sports: SportDTO[];   // era: pricePerHour + type
}

export enum StatusEnum {
  Confirmada = 'Confirmada',
  Cancelada = 'Cancelada',
}

export interface Reservation {
  id: string;
  name: string;
  phoneNumber: string;
  userId: string;
  dateOfReservation: string;
  court: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm – HH:mm"
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