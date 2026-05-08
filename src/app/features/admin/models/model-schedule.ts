export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export interface CreateScheduleDTO {
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
  isBlocked: boolean;
  isReserved: boolean;
  isFixed: boolean;
  dayOfWeek: DayOfWeek;
  courtId: string;
}

export interface UpdateScheduleDTO {
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  isReserved: boolean;
  isFixed: boolean;
  dayOfWeek: DayOfWeek;
}

export interface ResponseScheduleDTO {
  id: string;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  isReserved: boolean;
  isFixed: boolean;
  dayOfWeek: DayOfWeek;
  courtId: string;
}
