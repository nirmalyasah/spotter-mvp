import { redirect } from "next/navigation";
import AuthForm from "@/app/components/AuthForm";
import Logo from "@/app/components/Logo";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Sign up" };

export default async function Page() {
  if (await currentUser()) redirect("/app");
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Logo />
      <div className="mt-8"><AuthForm mode="signup" /></div>
    </main>
  );
}
