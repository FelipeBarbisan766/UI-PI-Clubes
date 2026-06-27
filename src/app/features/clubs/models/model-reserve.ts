export interface CreateReserveDTO {
  /** ISO date-time: 'YYYY-MM-DDT00:00:00' */
  date: string;
  scheduleId: string;
  playerId: string;
}

export interface ResponseReserveDTO {
  id: string;
  date: string;
  scheduleId: string;
  playerId: string;
}