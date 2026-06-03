"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { userColor } from "@/lib/avatar";
import { toast } from "sonner";

interface StudyNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

export default function StudyNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<StudyNote | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  useEffect(() => {
    fetch(`/api/study-notes/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((n) => {
        setNote(n);
        setForm({ title: n.title, content: n.content });
      })
      .catch(() => { toast.error("노트를 불러오지 못했어요."); router.push("/study-notes"); })
      .finally(() => setLoading(false));

    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => s?.user?.id && setMyId(s.user.id));
  }, [id, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/study-notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setNote(updated);
      setEditOpen(false);
      toast.success("수정되었어요!");
    } else {
      toast.error("수정에 실패했어요.");
    }
  }

  async function handleDelete() {
    if (!confirm("학습노트를 삭제할까요?")) return;
    const res = await fetch(`/api/study-notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("삭제했어요.");
      router.push("/study-notes");
    } else {
      toast.error("삭제에 실패했어요.");
    }
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">불러오는 중...</div>;
  if (!note) return null;

  const color = userColor(note.user.id);
  const isMine = note.user.id === myId;

  return (
    <div className="max-w-2xl space-y-6">
      {/* 뒤로 + 액션 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Button>
        {isMine && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="w-3.5 h-3.5" />
              수정
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5" />
              삭제
            </Button>
          </div>
        )}
      </div>

      {/* 헤더 */}
      <div className="space-y-3">
        <h1 className="text-xl md:text-2xl font-bold leading-snug">{note.title}</h1>
        <div className="flex items-center gap-3">
          <Avatar className="w-7 h-7">
            <AvatarFallback className={`${color.bg} ${color.text} text-xs font-bold`}>
              {note.user.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{note.user.name}</span>
          <span className="text-muted-foreground text-xs">
            {format(parseISO(note.createdAt), "yyyy년 M월 d일 HH:mm", { locale: ko })}
          </span>
        </div>
      </div>

      <hr className="border-border" />

      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{note.content}</p>
      </div>

      {/* 수정 모달 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>학습노트 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>제목</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>내용</Label>
              <Textarea className="min-h-48 resize-none" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
              <Button type="submit" disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
