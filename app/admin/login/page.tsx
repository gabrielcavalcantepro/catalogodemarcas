import { LoginForm } from "./login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4">
      <LoginForm from={from ?? "/admin"} />
    </div>
  );
}
