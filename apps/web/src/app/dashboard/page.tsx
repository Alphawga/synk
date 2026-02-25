import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { SessionsGrid } from "./_components/sessions-grid";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    // Prefetch sessions for the dashboard
    void api.sessions.getAll.prefetch({ limit: 50 });
    void api.sessions.getCount.prefetch();

    return (
        <HydrateClient>
            <SessionsGrid />
        </HydrateClient>
    );
}
