import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, BookOpen, Users, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { userColor } from "@/lib/avatar";
import AttendanceWidget from "@/components/AttendanceWidget";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [
    myWorkLogs,
    myStudyNotes,
    goals,
    allUsers,
    workLogCount,
    studyNoteCount,
    meetingCount,
  ] = await Promise.all([
    prisma.workLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { id: true, name: true } } } }),
    prisma.studyNote.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { id: true, name: true } } } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.user.findMany(),
    prisma.workLog.count({ where: { userId } }),
    prisma.studyNote.count({ where: { userId } }),
    prisma.meeting.count(),
  ]);

  const myGoalsDone = goals.filter((g) => g.done).length;
  const myGoalsTotal = goals.length;

  const stats = [
    { label: "업무일지", value: workLogCount, icon: FileText, href: "/work-logs", color: "text-blue-500" },
    { label: "학습노트", value: studyNoteCount, icon: BookOpen, href: "/study-notes", color: "text-emerald-500" },
    { label: "회의록", value: meetingCount, icon: Users, href: "/meetings", color: "text-purple-500" },
    { label: "목표달성", value: `${myGoalsDone}/${myGoalsTotal}`, icon: Target, href: "/goals", color: "text-orange-500" },
  ];

  const feed = [
    ...myWorkLogs.map((w) => ({ type: "work" as const, item: w, href: "/work-logs", date: w.createdAt })),
    ...myStudyNotes.map((s) => ({ type: "study" as const, item: s, href: `/study-notes/${s.id}`, date: s.createdAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const color = userColor(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">
          안녕하세요, {session!.user.name}님 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "yyyy년 M월 d일 EEEE", { locale: ko })}
        </p>
      </div>

      <AttendanceWidget />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color: iconColor }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 bg-white">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 내 최근 활동 */}
        <div className="md:col-span-2 space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            내 최근 활동
          </h2>

          <Card className="border-0 bg-white overflow-hidden">
            {feed.length === 0 ? (
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                아직 기록이 없어요. 첫 번째 기록을 남겨볼까요? 🌱
              </CardContent>
            ) : (
              <div className="divide-y divide-border/60">
                {feed.map(({ type, item, href, date }) => (
                  <Link
                    key={item.id}
                    href={href}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors group"
                  >
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarFallback className={`${color.bg} ${color.text} text-[10px] font-bold`}>
                        {session!.user.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge
                      variant="secondary"
                      className={`text-xs flex-shrink-0 border-0 ${type === "work" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}
                    >
                      {type === "work" ? "업무일지" : "학습노트"}
                    </Badge>
                    <span className="text-sm truncate flex-1 min-w-0 group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(date), "M/d HH:mm")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-3">
          {/* 내 목표 */}
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            내 목표
          </h2>
          <Card className="border-0 bg-white">
            <CardContent className="py-3 px-4 space-y-2">
              {goals.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  목표를 추가해보세요 🎯
                </p>
              )}
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${goal.done ? "bg-primary" : "border-2 border-border"}`} />
                  <span className={`text-sm truncate flex-1 min-w-0 ${goal.done ? "line-through text-muted-foreground" : ""}`}>
                    {goal.title}
                  </span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {goal.type === "WEEKLY" ? "주간" : "월간"}
                  </Badge>
                </div>
              ))}
              <Link href="/goals" className="block pt-1">
                <span className="text-xs text-primary hover:underline">목표 관리 →</span>
              </Link>
            </CardContent>
          </Card>

          {/* 멤버 */}
          <h2 className="font-semibold flex items-center gap-2 pt-2">
            <Users className="w-4 h-4 text-primary" />
            멤버
          </h2>
          <Card className="border-0 bg-white">
            <CardContent className="py-3 px-4 space-y-2">
              {allUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={`${userColor(u.id).bg} ${userColor(u.id).text} text-xs font-semibold`}>
                      {u.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  {u.id === userId && (
                    <Badge className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/20 flex-shrink-0">나</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
