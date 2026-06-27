export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}
export enum ReserveStatusEnum {
  Pending   = 0,
  Confirmed = 1,
  Cancelled = 2,
}
export interface ReserveInfoDTO {
  id: string;
  status: ReserveStatusEnum;
}

export interface ScheduleAvailabilityDTO {
  id:  string;
  startTime:   string;            // ex.: "08:00:00"
  endTime:     string;            // ex.: "09:00:00"
  isAvailable: boolean;           // !isBlocked && reserve == null
  isBlocked:   boolean;           // horário fixo/bloqueado
  reserve:     ReserveInfoDTO | null;
}

