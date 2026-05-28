export enum DayOfWeek {
  Sunday = "Sunday",
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
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
