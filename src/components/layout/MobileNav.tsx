"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { userColor } from "@/lib/avatar";
import { navItems } from "./nav";

interface MobileNavProps {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
}

export default function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current =
    navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.label ?? "YKSpace";

  return (
    <>
      {/* 모바일 상단바 */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-border px-4 h-14">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm">{current}</span>
        <Link href="/dashboard" className="ml-auto text-lg font-bold text-primary">
          YKSpace
        </Link>
      </header>

      {/* 드로어 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 gap-0" showCloseButton={false}>
          <SheetTitle className="sr-only">메뉴</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="px-5 py-5 border-b border-border">
              <span className="text-xl font-bold text-primary">YKSpace</span>
              <p className="text-xs text-muted-foreground mt-0.5">교훈이의 성장 공간</p>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    pathname === href || pathname.startsWith(href + "/")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="px-3 py-4 border-t border-border">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={`${userColor(user.id).bg} ${userColor(user.id).text} text-xs font-semibold`}>
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="mt-1 flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
