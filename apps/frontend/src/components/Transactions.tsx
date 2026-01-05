"use client";

import { Transaction } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Transactions() {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => await api<Transaction[]>("/user/transactions"),
    refetchOnWindowFocus: true,
    retry: false,
  });

  return (
    <Card className="shadow-md border-0 w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Transactions
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="icon"
            disabled={isLoading}>
            <RefreshCcw className={isLoading ? "animate-spin" : ""} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading...
          </div>
        ) : data == undefined || data.length === 0 ? (
          <div className="text-muted-foreground py-4">
            No transactions found.
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((tx) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  tx.type === "buy"
                    ? "bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30"
                    : "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30"
                }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        tx.type === "buy"
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}>
                      {tx.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Qty: <span className="font-medium">{tx.quantity}</span>
                    </span>
                    <span className="font-mono">
                      Price: <span className="font-medium">${tx.price}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
