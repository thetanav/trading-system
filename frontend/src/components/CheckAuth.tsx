"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function CheckAuth() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      router.push("/login");
    }
  }, [token, router]);

  if (!token) {
    return null;
  }
}
