"use client";

import { useEffect, useState } from "react";
import { format, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Clock } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  dateKey: string;
  clockIn: string;
  clockOut: string | null;
}

function duration(clockIn: string, clockOut: string | null) {
  const end = clockOut ? new Date(clockOut) : new Date();
  const mins = differenceInMinutes(end, new Date(clockIn));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

export default function AttendanceWidget() {
  const [record, setRecord] = useState<AttendanceRecord | null | "none">("none");
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM");
    fetch(`/api/attendance?month=${today}`)
      .then((r) => r.json())
      .then((list: AttendanceRecord[]) => {
        const todayKey = format(new Date(), "yyyy-MM-dd");
        const todayRecord = list.find((r) => r.dateKey === todayKey) ?? null;
        setRecord(todayRecord);
      })
      .catch(() => setRecord(null));
  }, []);

  // 근무중일 때 타이머
  useEffect(() => {
    if (!record || record === "none" || record.clockOut) return;
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, [record]);

  async function clockIn() {
    setLoading(true);
    const res = await fetch("/api/attendance", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setRecord(data);
      toast.success("출근 완료! 오늘도 화이팅 🔥");
    } else if (res.status === 409) {
      const data = await res.json();
      setRecord(data.record);
      toast("이미 출근했어요!");
    } else {
      toast.error("출근 처리 실패");
    }
  }

  async function clockOut() {
    if (!record || record === "none") return;
    setLoading(true);
    const res = await fetch(`/api/attendance/${record.id}`, { method: "PATCH" });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setRecord(data);
      toast.success("퇴근 완료! 수고했어요 🏠");
    } else if (res.status === 409) {
      const data = await res.json();
      setRecord(data.record);
      toast("이미 퇴근했어요!");
    } else {
      toast.error("퇴근 처리 실패");
    }
  }

  if (record === "none") return null;

  const isOut = record?.clockOut != null;
  const isWorking = record && !isOut;

  return (
    <div className="bg-white rounded-xl px-5 py-4 shadow-sm flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isWorking ? "bg-emerald-400 animate-pulse" : isOut ? "bg-muted-foreground" : "bg-border"}`} />
        <div>
          {!record ? (
            <p className="text-sm font-medium text-muted-foreground">오늘 아직 출근 전이에요</p>
          ) : isWorking ? (
            <>
              <p className="text-sm font-semibold text-emerald-600">근무중 🟢</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(record.clockIn), "HH:mm")} 출근 · {duration(record.clockIn, null)} 째
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">퇴근 완료</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(record.clockIn), "HH:mm")} 출근 → {format(new Date(record.clockOut!), "HH:mm")} 퇴근 · {duration(record.clockIn, record.clockOut)}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {!record && (
          <Button size="sm" onClick={clockIn} disabled={loading} className="gap-1.5">
            <LogIn className="w-3.5 h-3.5" />
            출근
          </Button>
        )}
        {isWorking && (
          <Button size="sm" variant="outline" onClick={clockOut} disabled={loading} className="gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            퇴근
          </Button>
        )}
        {isOut && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {duration(record.clockIn, record.clockOut)}
          </div>
        )}
      </div>
    </div>
  );
}
