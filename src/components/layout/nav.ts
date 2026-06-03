import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Target,
  Clock,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/work-logs", label: "업무일지", icon: FileText },
  { href: "/study-notes", label: "학습노트", icon: BookOpen },
  { href: "/meetings", label: "회의록", icon: Users },
  { href: "/goals", label: "목표", icon: Target },
  { href: "/attendance", label: "출근부", icon: Clock },
];
