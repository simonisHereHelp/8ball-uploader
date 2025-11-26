// app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";


export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/uploader");
  }

  if (session.user?.email === "99.cent.bagel@gmail.com") {
    redirect("/uploader");
  }

  // Wrong account UX
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black space-y-4">
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Signed in as <strong>{session.user?.email}</strong>, but this app is restricted to{" "}
        <strong>99.cent.bagel@gmail.com</strong>.
      </p>
      <Link
        href="/api/auth/signin?callbackUrl=/textsniff"
        className="rounded-md border border-zinc-400 px-4 py-2 text-base hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        Sign in with a different account
      </Link>
    </div>
  );
}

