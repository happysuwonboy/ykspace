import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");

  return (
    <div className="md:flex md:h-screen md:overflow-hidden">
      <Sidebar user={session.user} />
      <div className="flex-1 min-w-0 flex flex-col md:overflow-hidden">
        <MobileNav user={session.user} />
        <main className="flex-1 md:overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
