import { TaskDirectory } from "@/components/TaskDirectory";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ tagId?: string | string[] }> }) {
  const { tagId } = await searchParams;
  const initialTagId = typeof tagId === "string" ? tagId : "";
  return <TaskDirectory initialTagId={initialTagId} key={initialTagId} />;
}
