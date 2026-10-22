import { requireUser } from "@/lib/auth";
import Logo from "../components/Logo";
import WelcomeClient from "../components/WelcomeClient";

export const metadata = { title: "Welcome" };

export default async function Welcome() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <Logo href="/app" />
      <div className="mt-8"><WelcomeClient name={user.name.split(" ")[0]} /></div>
    </main>
  );
}
