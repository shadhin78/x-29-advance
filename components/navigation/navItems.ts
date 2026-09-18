import {
  LayoutDashboard,
  BarChart3,
  Timer,
  CheckSquare,
  CalendarDays,
  BookOpen,
  Gauge,
  Settings,
  Trophy,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  colorClass: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    colorClass: 'text-blue-500 hover:border-blue-400',
  },
  {
    id: 'analytics',
    label: 'Spectra Analytics',
    href: '/analytics',
    icon: BarChart3,
    colorClass: 'text-fuchsia-500 hover:border-fuchsia-400',
  },
  {
    id: 'focus',
    label: 'Focus (Timer)',
    href: '/focus',
    icon: Timer,
    colorClass: 'text-emerald-500 hover:border-emerald-400',
  },
  {
    id: 'daily-actions',
    label: 'Daily Actions',
    href: '/daily-actions',
    icon: CheckSquare,
    colorClass: 'text-orange-500 hover:border-orange-400',
  },
  {
    id: 'schedule',
    label: 'Daily Schedule',
    href: '/schedule',
    icon: CalendarDays,
    colorClass: 'text-cyan-500 hover:border-cyan-400',
  },
  {
    id: 'subjects',
    label: 'Subjects',
    href: '/subjects',
    icon: BookOpen,
    colorClass: 'text-violet-500 hover:border-violet-400',
  },
  {
    id: 'pace',
    label: 'Pace Management',
    href: '/pace',
    icon: Gauge,
    colorClass: 'text-rose-500 hover:border-rose-400',
  },
  {
    id: 'master-config',
    label: 'Master Config',
    href: '/master-config',
    icon: Settings,
    colorClass: 'text-indigo-500 hover:border-indigo-400',
  },
  {
    id: 'outcome',
    label: 'Outcome',
    href: '/outcome',
    icon: Trophy,
    colorClass: 'text-yellow-500 hover:border-yellow-400',
  },
  {
    id: 'exam',
    label: 'Exam Routine',
    href: '/exam',
    icon: GraduationCap,
    colorClass: 'text-red-500 hover:border-red-400',
  },
];
