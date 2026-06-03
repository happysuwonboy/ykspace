"use client";

import { useEffect, useState, useMemo } from "react";
import { format, isToday, isYesterday, parseISO, subDays, addDays, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, ChevronLeft, ChevronRight, Calendar, CheckSquare, Square, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { userColor } from "@/lib/avatar";

interface WorkLog {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface Goal {
  id: string;
  title: string;
  type: "WEEKLY" | "MONTHLY";
  done: boolean;
  userId: string;
}

function dateLabel(date: Date) {
  if (isToday(date)) return "오늘";
  if (isYesterday(date)) return "어제";
  return format(date, "M월 d일 EEEE", { locale: ko });
}

export default function WorkLogsPage() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({ content: "" });

  useEffect(() => {
    fetch("/api/work-logs")
      .then((r) => r.json())
      .then(setLogs)
      .catch(() => toast.error("데이터를 불러오지 못했어요."));

    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => s?.user?.id && setMyId(s.user.id));
  }, []);

  useEffect(() => {
    if (!dialogOpen) return;
    fetch("/api/goals")
      .then((r) => r.json())
      .then((all: Goal[]) => setGoals(all))
      .catch(() => {});
  }, [dialogOpen]);

  const myGoals = useMemo(() => goals.filter((g) => g.userId === myId), [goals, myId]);
  const weeklyGoals = myGoals.filter((g) => g.type === "WEEKLY");
  const monthlyGoals = myGoals.filter((g) => g.type === "MONTHLY");

  const grouped = useMemo(() => {
    const map = new Map<string, WorkLog[]>();
    logs.forEach((log) => {
      const key = format(parseISO(log.createdAt), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    });
    return map;
  }, [logs]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedLogs = grouped.get(selectedKey) ?? [];
  const datesWithLogs = useMemo(() => new Set(grouped.keys()), [grouped]);

  // 오늘 내 업무일지
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const myTodayLog = useMemo(
    () => (grouped.get(todayKey) ?? []).find((l) => l.user.id === myId) ?? null,
    [grouped, todayKey, myId]
  );

  function openCreate() {
    setEditingLog(null);
    setForm({ content: "" });
    setDialogOpen(true);
  }

  function openEdit(log: WorkLog) {
    setEditingLog(log);
    setForm({ content: log.content });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);

    let res: Response;

    if (editingLog) {
      res = await fetch(`/api/work-logs/${editingLog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      res = await fetch("/api/work-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // 오늘 이미 작성한 경우 자동으로 수정 모드로 전환
      if (res.status === 409) {
        const data = await res.json();
        const existing = logs.find((l) => l.id === data.id);
        if (existing) openEdit(existing);
        setLoading(false);
        toast("오늘 업무일지가 이미 있어요. 수정 모드로 전환할게요.");
        return;
      }
    }

    setLoading(false);

    if (res.ok) {
      const saved = await res.json();
      setLogs((prev) =>
        editingLog
          ? prev.map((l) => (l.id === saved.id ? saved : l))
          : [saved, ...prev]
      );
      setDialogOpen(false);
      setSelectedDate(new Date());
      toast.success(editingLog ? "업무일지가 수정되었어요!" : "업무일지가 등록되었어요!");
    } else {
      toast.error("저장에 실패했어요.");
    }
  }

  async function handleDelete(log: WorkLog) {
    if (!confirm("업무일지를 삭제할까요?")) return;

    const res = await fetch(`/api/work-logs/${log.id}`, { method: "DELETE" });
    if (res.ok) {
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
      toast.success("삭제했어요.");
    } else {
      toast.error("삭제에 실패했어요.");
    }
  }

  const isEditMode = !!editingLog;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500 shrink-0" />
            업무일지
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">멤버별 하루 기록을 함께 확인해요</p>
        </div>
        {myTodayLog ? (
          <Button variant="outline" className="gap-2 shrink-0" onClick={() => openEdit(myTodayLog)}>
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">오늘 업무일지 </span>수정
          </Button>
        ) : (
          <Button className="gap-2 shrink-0" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            오늘 업무일지
          </Button>
        )}
      </div>

      {/* 작성/수정 모달 */}
      <Dialog open={dialogOpen} onOpenChange={(o) => setDialogOpen(o)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "업무일지 수정" : "오늘 업무일지"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-5 mt-2">
            <form onSubmit={handleSubmit} className="flex-1 space-y-4 min-w-0">
              <div className="space-y-1.5">
                <Label>오늘 한 일</Label>
                <Textarea
                  placeholder={`오늘 무엇을 했나요?\n\n예시:\n- 업무일지 기능 구현\n- 코드 리뷰\n- 버그 수정`}
                  className="min-h-52 resize-none leading-relaxed"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "저장 중..." : isEditMode ? "수정" : "등록"}
                </Button>
              </div>
            </form>

            {/* 목표 사이드바 */}
            <div className="w-full md:w-48 shrink-0 space-y-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-5 order-first md:order-none">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">내 목표</p>
              {weeklyGoals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">📅 주간</p>
                  {weeklyGoals.map((g) => (
                    <div key={g.id} className="flex items-start gap-1.5">
                      {g.done
                        ? <CheckSquare className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        : <Square className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      }
                      <span className={`text-xs leading-snug ${g.done ? "line-through text-muted-foreground" : ""}`}>{g.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {monthlyGoals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">🗓️ 월간</p>
                  {monthlyGoals.map((g) => (
                    <div key={g.id} className="flex items-start gap-1.5">
                      {g.done
                        ? <CheckSquare className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                        : <Square className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      }
                      <span className={`text-xs leading-snug ${g.done ? "line-through text-muted-foreground" : ""}`}>{g.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {weeklyGoals.length === 0 && monthlyGoals.length === 0 && (
                <p className="text-xs text-muted-foreground">아직 목표가 없어요</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 날짜 네비게이터 */}
      <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
        <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-base">
            {isToday(selectedDate) ? "오늘 📅" : isYesterday(selectedDate) ? "어제" : format(selectedDate, "M월 d일", { locale: ko })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(selectedDate, "yyyy년 M월 d일 EEEE", { locale: ko })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isToday(selectedDate) && (
            <button onClick={() => setSelectedDate(new Date())} className="mr-1 px-2 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
              오늘로
            </button>
          )}
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            disabled={isToday(selectedDate)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 카드 목록 */}
      <div className="space-y-2.5">
        {selectedLogs.length === 0 ? (
          <Card className="border-0 bg-white">
            <CardContent className="py-12 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {isToday(selectedDate) ? "오늘 작성된 업무일지가 없어요. 첫 번째로 기록해보세요! 📝" : "이 날 작성된 업무일지가 없어요."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-xs text-muted-foreground px-1">{selectedLogs.length}개의 업무일지</p>
            {selectedLogs.map((log) => {
              const color = userColor(log.user.id);
              const isMine = log.user.id === myId;
              return (
                <Card key={log.id} className="border-0 bg-white hover:shadow-sm transition-shadow">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-9 h-9 mt-0.5 flex-shrink-0">
                        <AvatarFallback className={`${color.bg} ${color.text} text-sm font-bold`}>
                          {log.user.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{log.user.name}</span>
                          <span className="text-xs text-muted-foreground">{format(parseISO(log.createdAt), "HH:mm")}</span>
                          {isMine && (
                            <div className="ml-auto flex items-center gap-1">
                              <button
                                onClick={() => openEdit(log)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(log)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground mt-1.5 whitespace-pre-wrap leading-relaxed">{log.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* 기록 있는 날 빠른 이동 */}
      {datesWithLogs.size > 1 && (
        <div className="pt-1">
          <p className="text-xs text-muted-foreground mb-2 px-1">기록이 있는 날</p>
          <div className="flex flex-wrap gap-2">
            {[...datesWithLogs].sort((a, b) => b.localeCompare(a)).slice(0, 10).map((dateKey) => {
              const d = parseISO(dateKey);
              const isSelected = isSameDay(d, selectedDate);
              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isSelected ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-accent border border-border"
                  }`}
                >
                  {dateLabel(d)}
                  <span className="ml-1.5 opacity-60">{grouped.get(dateKey)!.length}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
