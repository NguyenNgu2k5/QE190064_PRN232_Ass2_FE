import { AuthForm } from "@/components/AuthForm";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const query = await searchParams;
  return <AuthForm mode="login" registered={query.registered === "1"} />;
}
