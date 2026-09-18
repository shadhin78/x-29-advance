/**
 * X-29 Study Task Types
 */

export interface StudyTask {
  id: string | number;
  date: string;
  track: string;
  subject: string;
  chapter: string | number;
  completed: boolean;
  skipped?: boolean;
  revision?: boolean;
  isHoliday?: boolean;
  holidayTitle?: string;
  originalChapter?: string | number;
  actualDateCompleted?: string | null;
  updatedAt?: number;
}
