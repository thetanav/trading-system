"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

type FormData = {
  side: "bid" | "ask";
  price: string;
  quantity: string;
};

const MakeOrder = () => {
  const [formData, setFormData] = useState<FormData>({
    side: "bid",
    price: "",
    quantity: "",
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: FormData) =>
      await api("/trade/makeorder", {
        method: "POST",
        body: JSON.stringify({
          side: data.side,
          price: Number(data.price),
          quantity: Number(data.quantity),
          market: false,
        }),
      }),
    onSuccess: (data: any) => {
      if (data.ok) {
        toast.success("Order submitted successfully!");
        setFormData((prev) => ({ ...prev, price: "", quantity: "" }));
      } else {
        toast.info(data.msg);
      }
    },
    onError: () => {
      toast.warning("Network busy.");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate(formData);
  };

  return (
    <Card>
      <CardContent>
        <Tabs
          value={formData.side}
          onValueChange={(v: string) =>
            setFormData((prev) => ({ ...prev, side: v as "bid" | "ask" }))
          }
          className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bid" className="data-[state=active]:bg-primary">
              BUY (Bid)
            </TabsTrigger>
            <TabsTrigger
              value="ask"
              className="data-[state=active]:bg-destructive">
              SELL (Ask)
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2 items-center justify-between">
            <p>Price</p>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="..."
              required
              className="w-24"
            />
          </div>
          <div className="flex space-x-2 items-center justify-between">
            <p>Quantity</p>
            <Input
              id="quantity"
              type="number"
              step="1"
              className="w-24"
              value={formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: e.target.value }))
              }
              placeholder="..."
              required
            />
          </div>
          <Button
            type="submit"
            className={`w-full ${
              formData.side === "bid" ? "bg-green-500 hover:bg-green-600" : ""
            }`}
            variant={formData.side === "ask" ? "destructive" : "default"}
            disabled={isPending || !formData.price || !formData.quantity}>
            {isPending
              ? "Placing Order..."
              : formData.side === "bid"
              ? "Place Buy Order"
              : "Place Sell Order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MakeOrder;
