import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Sidebar } from "./_components/sidebar";
import { TopBar } from "./_components/top-bar";

import { ToastProvider } from "./_components/toast";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    return (
        <ToastProvider>
            <div className="flex h-screen overflow-hidden bg-bg-base">
                <Sidebar user={session.user} />
                <div className="flex flex-1 flex-col min-w-0 overflow-hidden p-8">
                    <TopBar />
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}
