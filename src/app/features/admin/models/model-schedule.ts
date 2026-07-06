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
  dayOfWeek: DayOfWeek;
  courtId: string;
}

export interface UpdateScheduleDTO {
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
}

export interface ResponseScheduleDTO {
  id: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  courtId: string;
}
export interface CreateBulkScheduleDTO {
  daysOfWeek: DayOfWeek[];
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  slotDurationMinutes: number;
  courtId: string;
}

export interface ScheduleConflictDTO {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface ResponseBulkScheduleDTO {
  created: ResponseScheduleDTO[];
  conflicts: ScheduleConflictDTO[];
}