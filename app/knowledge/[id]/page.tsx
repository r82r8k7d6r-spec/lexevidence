import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KnowledgeEntry } from "@/types";
import KnowledgeDetail from "./KnowledgeDetail";

export const dynamic = "force-dynamic";

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: entry, error } = await supabase
    .from("knowledge_entries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !entry) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/knowledge" className="text-sm text-gray-500 hover:underline">
          ← ナレッジベースに戻る
        </Link>
      </div>
      <KnowledgeDetail entry={entry as KnowledgeEntry} />
    </div>
  );
}
