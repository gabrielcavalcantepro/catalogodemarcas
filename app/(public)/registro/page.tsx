import { redirect } from "next/navigation";
import { getCreatorId } from "@/lib/auth/creator";
import { RegisterForm } from "@/components/register-form";

export default async function RegistroPage() {
  const creatorId = await getCreatorId();
  if (creatorId) {
    redirect("/");
  }

  return <RegisterForm />;
}
