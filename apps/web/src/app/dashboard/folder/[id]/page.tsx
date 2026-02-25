import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { FolderPageContent } from "./folder-page-content";

interface FolderPageProps {
    params: Promise<{ id: string }>;
}

export default async function FolderPage({ params }: FolderPageProps) {
    const session = await auth();
    if (!session?.user) redirect("/api/auth/signin");

    const { id } = await params;

    void api.folders.getById.prefetch({ id });
    void api.folders.getAll.prefetch();

    return (
        <HydrateClient>
            <FolderPageContent folderId={id} />
        </HydrateClient>
    );
}
