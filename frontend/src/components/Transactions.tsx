"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Transaction } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { RefreshCcw } from "lucide-react";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Transactions() {
  const [token] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchT() {
    setLoading(true);
    const res = await axios.get(apiURL + "/transactions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data) {
      setTransactions(res.data);
      setLoading(false);
      console.log("transaction comp re");
    }
  }

  useEffect(() => {
    fetchT();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchT()}
          disabled={loading}
          aria-label="Refresh transactions">
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-muted-foreground">No transactions found.</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col gap-2 p-3 border rounded-lg">
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
