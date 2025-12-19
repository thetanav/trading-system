"use client";

import { Transaction } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Loadable from "next/dist/shared/lib/loadable.shared-runtime";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Transactions() {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => await api<Transaction[]>("/user/transactions"),
    refetchOnWindowFocus: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Transactions
          <Button onClick={() => refetch()} variant="ghost" size="icon">
            <RefreshCcw />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading...
          </div>
        ) : data == undefined || data.length === 0 ? (
          <div className="text-muted-foreground">No transactions found.</div>
        ) : (
          <div className="space-y-3">
            {data.map((tx) => (
              <div key={tx.id} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                  <span
                    className={`text-sm font-semibold px-2 py-1 rounded ${
                      tx.type === "buy"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}>
                    {tx.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Qty: {tx.quantity}
                  </span>
                  <span className="font-mono">Price: ${tx.price}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
