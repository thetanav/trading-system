"use client";

import { User as UserType } from "../types";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const Profile = () => {
  const { data, isLoading } = useQuery({
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <img
              src={"https://avatar.vercel.sh/" + data.name}
              alt="avatar"
              draggable={false}
              className="w-full h-full rounded-full select-none"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{data.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {data.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Cash</p>
            <p className="font-mono font-semibold">
              ${Number(data.cash).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stock</p>
            <p className="font-mono font-semibold">{data.stock}</p>
          </div>
        </div>

        {data.createdAt && (
          <div className="pt-2 border-t">
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
