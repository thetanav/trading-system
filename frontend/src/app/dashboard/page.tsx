"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Depth from "../../components/Depth";
import MakeOrder from "../../components/MakeOrder";
import Balance from "../../components/Balance";
import { toast } from "sonner";
import Transactions from "../../components/Transactions";
import { Nav } from "../../components/Navbar";

export default function Dashboard() {
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

  return (
    <div className="flex items-start justify-center w-full gap-4 pt-2 min-h-screen">
      <Nav />
      <Depth />
      <div className="flex-col space-y-3 w-80">
        <Balance />
        <MakeOrder />
      </div>
      <Transactions />
    </div>
  );
}
