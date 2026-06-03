"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, Users, CheckSquare, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";

const PER_PAGE = 6;

interface ActionItem {
  id: string;
  content: string;
  done: boolean;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  agenda: string;
  notes: string | null;
  participants: { user: { id: string; name: string } }[];
  actionItems: ActionItem[];
}

function emptyForm() {
  return {
    title: "",
    date: new Date().toISOString().slice(0, 16),
    agenda: "",
    notes: "",
    actionItems: [] as string[],
  };
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [actionInput, setActionInput] = useState("");
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then(setMeetings)
      .catch(() => toast.error("데이터를 불러오지 못했어요."));
  }, []);

  const totalPages = Math.ceil(meetings.length / PER_PAGE);
  const pagedMeetings = meetings.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function addActionItem() {
    const t = actionInput.trim();
    if (t) setForm({ ...form, actionItems: [...form.actionItems, t] });
    setActionInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (res.ok) {
      const newMeeting = await res.json();
      setMeetings([newMeeting, ...meetings]);
      setForm(emptyForm());
      setActionInput("");
      setDialogOpen(false);
      setPage(1);
      toast.success("회의록이 등록되었어요!");
    } else {
      toast.error("등록에 실패했어요.");
    }
  }

  async function deleteMeeting(id: string) {
    if (!confirm("회의록을 삭제할까요?")) return;
    const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMeetings(meetings.filter((m) => m.id !== id));
      toast.success("삭제했어요.");
    } else {
      toast.error("삭제에 실패했어요.");
    }
  }

  async function toggleActionItem(meetingId: string, itemId: string, done: boolean) {
    await fetch(`/api/meetings/${meetingId}/action-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !done }),
    });
    setMeetings(meetings.map((m) =>
      m.id === meetingId
        ? { ...m, actionItems: m.actionItems.map((a) => a.id === itemId ? { ...a, done: !done } : a) }
        : m
    ));
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500 shrink-0" />
            회의록
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">회의 내용과 액션아이템을 기록해요</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">새 </span>회의록
        </Button>
      </div>

      {/* 작성 모달 */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm()); setActionInput(""); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회의록 작성</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>회의 제목</Label>
                <Input
                  placeholder="주간 스터디 회의"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>일시</Label>
                <Input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>안건</Label>
              <Textarea
                placeholder="오늘 논의할 내용..."
                className="min-h-24 resize-none"
                value={form.agenda}
                onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>회의 결과 / 메모</Label>
              <Textarea
                placeholder="회의에서 결정된 내용, 공유사항..."
                className="min-h-24 resize-none"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>액션아이템</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="할 일 입력 후 엔터"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addActionItem(); } }}
                />
                <Button type="button" variant="outline" onClick={addActionItem}>추가</Button>
              </div>
              {form.actionItems.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {form.actionItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-accent/50 rounded-lg px-3 py-2">
                      <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1">{item}</span>
                      <button type="button" onClick={() => setForm({ ...form, actionItems: form.actionItems.filter((_, j) => j !== i) })}>
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
              <Button type="submit" disabled={loading}>{loading ? "등록 중..." : "등록"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 목록 */}
      <div className="space-y-4">
        {meetings.length === 0 && (
          <Card className="border-0 bg-white">
            <CardContent className="py-12 text-center text-muted-foreground">
              첫 번째 회의록을 작성해보세요! 🤝
            </CardContent>
          </Card>
        )}
        {pagedMeetings.map((meeting) => (
          <Card key={meeting.id} className="border-0 bg-white hover:shadow-sm transition-shadow">
            <CardContent className="py-4 px-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{meeting.title}</h3>
                    <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                      {format(new Date(meeting.date), "M월 d일 HH:mm", { locale: ko })}
                    </Badge>
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {meeting.participants.map(({ user }) => (
                      <Badge key={user.id} variant="secondary" className="text-xs">{user.name}</Badge>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteMeeting(meeting.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">안건</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{meeting.agenda}</p>
                </div>
                {meeting.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">결과 / 메모</p>
                    <p className="text-sm whitespace-pre-wrap break-words">{meeting.notes}</p>
                  </div>
                )}
              </div>

              {meeting.actionItems.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    액션아이템 ({meeting.actionItems.filter((a) => a.done).length}/{meeting.actionItems.length} 완료)
                  </p>
                  <div className="space-y-1.5">
                    {meeting.actionItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleActionItem(meeting.id, item.id, item.done)}
                        className="flex items-center gap-2 text-sm w-full text-left hover:bg-accent/50 rounded-lg px-2 py-1 transition-colors"
                      >
                        {item.done
                          ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                          : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        }
                        <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.content}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
