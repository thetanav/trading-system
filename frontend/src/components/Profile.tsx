"use client";

import { User as UserType } from "../types";
import { Loader2, RefreshCcw, Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const Profile = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["user_info"],
    queryFn: async () => await api<UserType | null>("/user"),
    refetchOnWindowFocus: true,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading profile...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const totalValue = Number(data.cash) + Number(data.stock) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={"https://avatar.vercel.sh/" + data.name}
              alt="avatar"
              draggable={false}
              className="w-full h-full rounded-full select-none"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base truncate">{data.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {data.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => refetch()}
          disabled={isFetching}>
          <RefreshCcw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Portfolio Value */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Value</p>
          <p className="font-mono text-xl font-bold">
            ${totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Cash & Stock Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
              <p className="text-xs text-muted-foreground">Cash</p>
            </div>
            <p className="font-mono font-semibold text-green-600 dark:text-green-500">
              ${Number(data.cash).toLocaleString()}
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
              <p className="text-xs text-muted-foreground">Stock</p>
            </div>
            <p className="font-mono font-semibold text-blue-600 dark:text-blue-500">
              {Number(data.stock).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Member Since */}
        {data.createdAt && (
          <div className="pt-2 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Member since {formatDate(data.createdAt)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Profile;
