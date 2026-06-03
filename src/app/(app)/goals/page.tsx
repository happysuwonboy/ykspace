"use client";

import { useEffect, useState, useMemo } from "react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Target, CheckSquare, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { userColor } from "@/lib/avatar";

interface Goal {
  id: string;
  title: string;
  type: "WEEKLY" | "MONTHLY";
  done: boolean;
  createdAt: string;
  userId: string;
  user: { id: string; name: string };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [form, setForm] = useState({ title: "", type: "WEEKLY" as "WEEKLY" | "MONTHLY" });

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then(setGoals)
      .catch(() => toast.error("데이터를 불러오지 못했어요."));

    // 세션에서 내 id 가져오기
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => s?.user?.id && setMyId(s.user.id));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type: tab }),
    });

    setLoading(false);

    if (res.ok) {
      const newGoal = await res.json();
      setGoals([newGoal, ...goals]);
      setForm({ title: "", type: tab });
      setDialogOpen(false);
      toast.success("목표가 추가되었어요!");
    } else {
      toast.error("추가에 실패했어요.");
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm("목표를 삭제할까요?")) return;
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) {
      setGoals(goals.filter((g) => g.id !== id));
      toast.success("삭제했어요.");
    } else {
      toast.error("삭제에 실패했어요.");
    }
  }

  async function toggleGoal(id: string, done: boolean, ownerId: string) {
    if (ownerId !== myId) {
      toast("상대방 목표는 체크할 수 없어요 😅");
      return;
    }
    const res = await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done: !done }),
    });
    if (res.ok) {
      setGoals(goals.map((g) => g.id === id ? { ...g, done: !done } : g));
    }
  }

  const now = new Date();
  const weekRange = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return `${format(start, "M/d")} - ${format(end, "M/d")}`;
  }, []);
  const monthRange = useMemo(() => format(now, "yyyy년 M월", { locale: ko }), []);

  const filtered = goals.filter((g) => g.type === tab);

  // 멤버별 그룹핑
  const members = useMemo(() => {
    const map = new Map<string, { user: Goal["user"]; goals: Goal[] }>();
    filtered.forEach((g) => {
      if (!map.has(g.user.id)) map.set(g.user.id, { user: g.user, goals: [] });
      map.get(g.user.id)!.goals.push(g);
    });
    // 내가 먼저 오도록
    return [...map.values()].sort((a) => (a.user.id === myId ? -1 : 1));
  }, [filtered, myId]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-orange-500 shrink-0" />
            목표 트래커
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">주간, 월간 목표를 설정하고 달성해요</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">목표 </span>추가
        </Button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-full sm:w-fit overflow-x-auto">
        {(["WEEKLY", "MONTHLY"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "WEEKLY" ? "📅 주간" : "🗓️ 월간"}
            <span className="ml-2 text-xs opacity-70">
              {t === "WEEKLY" ? weekRange : monthRange}
            </span>
          </button>
        ))}
      </div>

      {/* 멤버별 목표 */}
      {members.length === 0 ? (
        <Card className="border-0 bg-white">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            아직 {tab === "WEEKLY" ? "주간" : "월간"} 목표가 없어요. 먼저 추가해보세요 🎯
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {members.map(({ user, goals: memberGoals }) => {
            const color = userColor(user.id);
            const done = memberGoals.filter((g) => g.done).length;
            const isMe = user.id === myId;
            const pct = memberGoals.length ? Math.round((done / memberGoals.length) * 100) : 0;

            return (
              <div key={user.id} className="space-y-3">
                {/* 멤버 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className={`${color.bg} ${color.text} text-xs font-bold`}>
                        {user.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{user.name}</span>
                    {isMe && (
                      <Badge className="text-xs bg-primary/10 text-primary border-0 hover:bg-primary/10">나</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{done}/{memberGoals.length} · {pct}%</span>
                </div>

                {/* 진행률 바 */}
                {memberGoals.length > 0 && (
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${tab === "WEEKLY" ? "bg-primary" : "bg-orange-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                {/* 목표 목록 */}
                <div className="space-y-2">
                  {memberGoals.map((goal) => (
                    <Card key={goal.id} className="border-0 bg-white hover:shadow-sm transition-shadow">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleGoal(goal.id, goal.done, goal.userId)}
                            className={`flex items-center gap-3 flex-1 text-left ${!isMe ? "cursor-default" : ""}`}
                          >
                            {goal.done
                              ? <CheckSquare className={`w-5 h-5 flex-shrink-0 ${tab === "WEEKLY" ? "text-primary" : "text-orange-400"}`} />
                              : <Square className={`w-5 h-5 flex-shrink-0 ${isMe ? "text-muted-foreground" : "text-muted-foreground/40"}`} />
                            }
                            <span className={`text-sm ${goal.done ? "line-through text-muted-foreground" : "font-medium"}`}>
                              {goal.title}
                            </span>
                          </button>
                          {isMe && (
                            <button
                              onClick={() => deleteGoal(goal.id)}
                              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 목표 추가 모달 */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>목표 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>유형</Label>
              <div className="flex gap-2">
                {(["WEEKLY", "MONTHLY"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-1 ${
                      tab === t ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t === "WEEKLY" ? "주간" : "월간"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>목표</Label>
              <Input
                placeholder={tab === "WEEKLY" ? "이번 주 목표를 적어보세요" : "이번 달 목표를 적어보세요"}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
              <Button type="submit" disabled={loading}>{loading ? "추가 중..." : "추가"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
