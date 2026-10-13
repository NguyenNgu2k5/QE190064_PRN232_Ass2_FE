import { AuthForm } from "@/components/AuthForm";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string; passwordChanged?: string }> }) {
  const query = await searchParams;
  return <AuthForm mode="login" registered={query.registered === "1"} passwordChanged={query.passwordChanged === "1"} />;
}
