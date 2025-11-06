"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { User as UserType } from "../types";
import { RefreshCcw } from "lucide-react";
import { Button } from "../components/ui/button";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const Balance = () => {
  const token = localStorage.getItem("token");
  const [info, setInfo] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    const res = await axios.get(apiURL + "/me", {
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
    <div className="w-full mx-auto text-card-foreground border py-4 px-6 rounded-xl">
      <div className="flex flex-row items-center justify-between pb-4">
        <h2 className="text-lg font-semibold">{info?.name}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchUsers()}
          aria-label="Refresh balance">
          <RefreshCcw
            className={"w-5 h-5 " + (loading ? "animate-spin" : "")}
          />
        </Button>
      </div>
      <div>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          info && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cash</span>
                <span className="text-md font-mono bg-muted px-3 py-1 rounded">
                  ${info!.cash.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stock Holdings</span>
                <span className="text-md font-mono bg-muted px-3 py-1 rounded">
                  {info!.stock}
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Balance;
