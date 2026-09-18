/**
 * X-29 Exam Routine & Session Types
 */

export interface ExamRoutineItem {
  id?: string;
  subject: string;
  program?: string;
  code?: string;
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  completed?: boolean;
}

export interface ExamSession {
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
  routine: ExamRoutineItem[];
}
