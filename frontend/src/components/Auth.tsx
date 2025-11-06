"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export default function Auth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token") as string);
    console.log("Auth Token:", localStorage.getItem("token"));
  }, []);

  const router = useRouter();

  if (!token) {
    return (
      <div>
        <Button
          asChild
          className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white outline-none">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Button
        asChild
        className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button
        variant={"destructive"}
        onClick={() => {
          localStorage.setItem("token", "");
          router.push("/");
        }}>
        Signout
      </Button>
    </div>
  );
}
