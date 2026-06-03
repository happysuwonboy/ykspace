"use client";

import { useEffect, useState, useMemo } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday, parseISO, differenceInMinutes,
} from "date-fns";
import { ko } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { userColor } from "@/lib/avatar";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  dateKey: string;
  clockIn: string;
  clockOut: string | null;
  user: { id: string; name: string };
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

function duration(clockIn: string, clockOut: string | null) {
  if (!clockOut) return null;
  const mins = differenceInMinutes(new Date(clockOut), new Date(clockIn));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);

  const monthKey = format(currentMonth, "yyyy-MM");

  useEffect(() => {
    fetch(`/api/attendance?month=${monthKey}`)
      .then((r) => r.json())
      .then(setRecords)
      .catch(() => toast.error("데이터를 불러오지 못했어요."));
  }, [monthKey]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(async (s) => {
        // 전체 멤버 목록
        const res = await fetch("/api/work-logs");
        const logs = await res.json();
        const seen = new Map<string, { id: string; name: string }>();
        logs.forEach((l: { user: { id: string; name: string } }) => seen.set(l.user.id, l.user));
        if (s?.user) seen.set(s.user.id, s.user);
        setAllUsers([...seen.values()]);
      });
  }, []);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // 월~일 시작을 위한 앞 빈칸 (월요일=0)
  const leadingBlanks = useMemo(() => {
    const dow = getDay(startOfMonth(currentMonth)); // 0=일
    return dow === 0 ? 6 : dow - 1;
  }, [currentMonth]);

  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    records.forEach((r) => {
      if (!map.has(r.dateKey)) map.set(r.dateKey, []);
      map.get(r.dateKey)!.push(r);
    });
    return map;
  }, [records]);

  // 이번 달 통계
  const stats = useMemo(() => {
    const userStats = new Map<string, { days: number; totalMins: number; name: string }>();
    records.forEach((r) => {
      if (!userStats.has(r.user.id)) userStats.set(r.user.id, { days: 0, totalMins: 0, name: r.user.name });
      const s = userStats.get(r.user.id)!;
      s.days++;
      if (r.clockOut) s.totalMins += differenceInMinutes(new Date(r.clockOut), new Date(r.clockIn));
    });
    return [...userStats.values()];
  }, [records]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-500 shrink-0" />
            출근부
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">출퇴근 기록을 확인해요</p>
        </div>

        {/* 월 이동 */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="font-semibold text-sm w-24 text-center">
            {format(currentMonth, "yyyy년 M월", { locale: ko })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-accent transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 이달 통계 */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => {
            const user = allUsers.find((u) => u.name === s.name);
            const color = user ? userColor(user.id) : { bg: "bg-muted", text: "text-muted-foreground" };
            const avgH = s.days > 0 ? Math.round(s.totalMins / s.days / 60 * 10) / 10 : 0;
            return (
              <div key={s.name} className="bg-white rounded-xl px-4 md:px-5 py-3 md:py-4 shadow-sm flex items-center gap-3 md:gap-4">
                <Avatar className="w-9 h-9 md:w-10 md:h-10 shrink-0">
                  <AvatarFallback className={`${color.bg} ${color.text} font-bold`}>
                    {s.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    출근 {s.days}일 · 평균 {avgH}시간
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 달력 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`py-2.5 text-center text-xs font-semibold ${i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-muted-foreground"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {/* 앞 빈칸 */}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} className="border-b border-r border-border/50 min-h-[64px] md:min-h-[100px]" />
          ))}

          {days.map((day, i) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayRecords = recordMap.get(dateKey) ?? [];
            const dow = (getDay(day) + 6) % 7; // 0=월 6=일
            const isWeekend = dow >= 5;
            const today = isToday(day);
            const colIndex = (leadingBlanks + i) % 7;
            const isLastRow = leadingBlanks + i >= Math.ceil((leadingBlanks + days.length) / 7) * 7 - 7;

            return (
              <div
                key={dateKey}
                className={`border-b border-r border-border/50 min-h-[64px] md:min-h-[100px] p-1 md:p-2 ${
                  isWeekend ? "bg-muted/20" : ""
                } ${today ? "bg-primary/5" : ""}`}
              >
                {/* 날짜 숫자 */}
                <p className={`text-[11px] md:text-xs font-semibold mb-1 md:mb-1.5 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${
                  today ? "bg-primary text-white" : colIndex === 5 ? "text-blue-400" : colIndex === 6 ? "text-red-400" : "text-foreground"
                }`}>
                  {format(day, "d")}
                </p>

                {/* 출퇴근 기록 */}
                <div className="space-y-1">
                  {dayRecords.map((r) => {
                    const user = allUsers.find((u) => u.id === r.user.id);
                    const color = user ? userColor(user.id) : { bg: "bg-muted", text: "text-muted-foreground" };
                    const dur = duration(r.clockIn, r.clockOut);

                    return (
                      <div key={r.id} className={`rounded md:rounded-md md:px-1.5 md:py-1 ${color.bg}`}>
                        {/* 모바일: 이니셜 칩 */}
                        <p className={`md:hidden text-[10px] font-bold text-center py-0.5 ${color.text}`}>
                          {r.user.name[0].toUpperCase()}
                        </p>
                        {/* 데스크톱: 상세 */}
                        <div className="hidden md:block">
                          <p className={`text-[10px] font-semibold ${color.text}`}>{r.user.name}</p>
                          <p className={`text-[10px] ${color.text} opacity-80`}>
                            {format(parseISO(r.clockIn), "HH:mm")}
                            {r.clockOut ? ` → ${format(parseISO(r.clockOut), "HH:mm")}` : " ~"}
                          </p>
                          {dur && (
                            <p className={`text-[10px] ${color.text} opacity-60`}>{dur}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {dayRecords.length === 0 && !isWeekend && !today && (
                    <p className="hidden md:block text-[10px] text-muted-foreground/40">결근</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
