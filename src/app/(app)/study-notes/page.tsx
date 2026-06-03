"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, BookOpen, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { userColor } from "@/lib/avatar";
import Link from "next/link";
import Pagination from "@/components/Pagination";

const PER_PAGE = 10;

interface StudyNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

export default function StudyNotesPage() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ title: "", content: "" });

  useEffect(() => {
    fetch("/api/study-notes")
      .then((r) => r.json())
      .then(setNotes)
      .catch(() => toast.error("데이터를 불러오지 못했어요."));
  }, []);

  const totalPages = Math.ceil(notes.length / PER_PAGE);
  const pagedNotes = notes.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function resetForm() {
    setForm({ title: "", content: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/study-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (res.ok) {
      const newNote = await res.json();
      setNotes([newNote, ...notes]);
      setPage(1);
      resetForm();
      setDialogOpen(false);
      toast.success("학습노트가 등록되었어요!");
    } else {
      toast.error("등록에 실패했어요.");
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500 shrink-0" />
            학습노트
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">공부한 내용을 기록하고 공유해요</p>
        </div>

        <Button className="gap-2 shrink-0" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">새 </span>학습노트
        </Button>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>학습노트 작성</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>제목</Label>
                <Input
                  placeholder="무엇을 공부했나요?"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>내용</Label>
                <Textarea
                  placeholder="학습한 내용을 자유롭게 적어주세요"
                  className="min-h-48 resize-none"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
                <Button type="submit" disabled={loading}>{loading ? "등록 중..." : "등록"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 게시판 리스트 */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {/* 헤더행 (데스크톱) */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 border-b border-border text-xs text-muted-foreground font-medium">
          <span>제목</span>
          <span className="w-16 text-center">작성자</span>
          <span className="w-14 text-right">날짜</span>
        </div>

        {notes.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            첫 번째 학습노트를 작성해보세요! 📚
          </div>
        ) : (
          pagedNotes.map((note, i) => {
            const color = userColor(note.user.id);
            return (
              <Link
                key={note.id}
                href={`/study-notes/${note.id}`}
                className={`flex sm:grid sm:grid-cols-[1fr_auto_auto] gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 items-center hover:bg-accent/40 transition-colors group ${
                  i !== pagedNotes.length - 1 ? "border-b border-border/60" : ""
                }`}
              >
                <span className="font-medium text-sm truncate flex-1 min-w-0 group-hover:text-primary transition-colors">
                  {note.title}
                </span>
                <div className="hidden sm:flex w-16 items-center justify-center gap-1.5">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className={`${color.bg} ${color.text} text-[10px] font-bold`}>
                      {note.user.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{note.user.name}</span>
                </div>
                <div className="shrink-0 sm:w-14 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <span>{format(parseISO(note.createdAt), "M/d", { locale: ko })}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
