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
      <div className="flex items-center gap-2">
        <Button asChild variant="default">
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Create Account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
