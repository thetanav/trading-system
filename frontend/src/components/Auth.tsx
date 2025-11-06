"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useCallback, useEffect, useState } from "react";

export default function Auth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const syncToken = () => {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken && storedToken.length > 0 ? storedToken : null);
    };

    syncToken();

    window.addEventListener("storage", syncToken);

    return () => {
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  const router = useRouter();

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    router.push("/");
  }, [router]);

  if (!token) {
    return (
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          className="hidden sm:flex font-medium text-muted-foreground hover:text-foreground hover:bg-white/10">
          <Link href="/login">Log In</Link>
        </Button>
        <Button
          asChild
          className="bg-linear-to-r from-blue-500 via-sky-500 to-indigo-500 hover:from-blue-500/90 hover:via-sky-500/90 hover:to-indigo-500/90 text-white shadow-lg shadow-blue-500/20">
          <Link href="/signup">Create Account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        asChild
        className="font-medium text-muted-foreground hover:text-foreground hover:bg-white/10">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button
        onClick={handleSignOut}
        className="bg-linear-to-r from-rose-500 to-orange-500 text-white hover:from-rose-500/90 hover:to-orange-500/90 shadow-lg shadow-rose-500/20">
        Sign Out
      </Button>
    </div>
  );
}
