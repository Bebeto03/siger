export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface AvailabilityBlock {
  id?: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm" ou "HH:mm:ss"
  endTime: string;
}
