"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const MakeOrder = () => {
  const token = localStorage.getItem("token");
  const [side, setSide] = useState<"bid" | "ask">("bid");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [quotePrice, setQuotePrice] = useState<string>("");

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await axios.get(apiURL + "quote");
        if (res.data.ok) {
          setQuotePrice(res.data.data);
        } else {
          setQuotePrice("");
        }
      } catch (err) {
        setQuotePrice("");
      }
    };
    fetchQuote();
  }, [side]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        apiURL + "trade/makeorder",
        {
          side,
          price: Number(price),
          quantity: Number(quantity),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.ok) {
        toast.success("Order submitted successfully!");
        setPrice("");
        setQuantity("");
      } else {
        toast.info(res.data.msg);
      }
    } catch (error) {
      toast.warning("Network busy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto text-card-foreground border py-4 px-6 rounded-xl">
      <div className="pb-4">
        <h2 className="text-xl font-bold text-center">Make Order</h2>
      </div>
      <div>
        <Tabs
          value={side}
          onValueChange={(v: string) => setSide(v as "bid" | "ask")}
          className="mb-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger
              value="bid"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-l-md">
              BUY (Bid)
            </TabsTrigger>
            <TabsTrigger
              value="ask"
              className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground rounded-r-md">
              SELL (Ask)
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="price"
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                required
                className="mt-1 flex-1"
              />
            </div>
            {quotePrice && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>Market Price:</span>
                <span className="font-mono font-semibold text-base text-primary">
                  {quotePrice}
                </span>
                <Button
                  type="button"
                  onClick={() => {
                    if (quotePrice) {
                      // Format to 6 decimals if it's a number
                      const formatted = isNaN(Number(quotePrice))
                        ? quotePrice
                        : Number(quotePrice).toFixed(6).replace(/\.0+$/, "");
                      setPrice(formatted);
                    }
                  }}
                  className="ml-1 text-primary text-xs font-medium"
                  title="Set as order price"
                  variant="outline"
                  size="sm"
                  aria-label="Set as order price">
                  Set
                </Button>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
              className="mt-1"
            />
          </div>
          <Button
            type="submit"
            className={`w-full font-bold py-2 mt-2 ${
              side === "bid"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-red-800 text-destructive-foreground hover:bg-red-700"
            }`}
            disabled={loading || !price || !quantity}>
            {loading
              ? "Placing Order..."
              : side === "bid"
              ? "Place Buy Order"
              : "Place Sell Order"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MakeOrder;
