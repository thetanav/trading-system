"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { User as UserType } from "../types";
import { RefreshCcw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const Balance = () => {
  const [token] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  });
  const [info, setInfo] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    const res = await axios.get(apiURL + "/user/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data) {
      setInfo(res.data);
      setLoading(false);
      console.log("balance comp re");
    }
  }

  useEffect(() => {
    fetchUsers();
    // console.log("user comp re");
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          {info?.name || "Balance"}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchUsers()}
          disabled={loading}
          aria-label="Refresh balance">
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          info && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cash</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  ${info!.cash.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stock Holdings</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {info!.stock}
                </span>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default Balance;
