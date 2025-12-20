"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Orderbook } from "@/types";

const Depth = () => {
  const { data: orderBook } = useQuery({
    queryKey: ["depth"],
    queryFn: async () => await api<Orderbook>("/trade/depth"),
    refetchInterval: 2000,
  });

  // Top 6 levels per side
  const topBids = useMemo(
    () => orderBook?.bids?.slice(0, 6) || [],
    [orderBook]
  );
  const topAsks = useMemo(
    () => orderBook?.asks?.slice(0, 6) || [],
    [orderBook]
  );

  // Totals & percentages
  const bidTotal = useMemo(
    () => topBids.reduce((acc, o) => acc + o.quantity, 0),
    [topBids]
  );
  const askTotal = useMemo(
    () => topAsks.reduce((acc, o) => acc + o.quantity, 0),
    [topAsks]
  );
  const combinedTotal = bidTotal + askTotal || 1;
  const buyPct = (bidTotal / combinedTotal) * 100;
  const sellPct = 100 - buyPct;

  // Relative sizing within each side for background intensity
  const maxBidQty = useMemo(
    () => (topBids.length ? Math.max(...topBids.map((o) => o.quantity)) : 1),
    [topBids]
  );
  const maxAskQty = useMemo(
    () => (topAsks.length ? Math.max(...topAsks.map((o) => o.quantity)) : 1),
    [topAsks]
  );

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  const formatQty = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex flex-col">
            <span>Buy orders</span>
            <span className="text-xl leading-none font-semibold text-green-400">
              {buyPct.toFixed(2)}%
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span>Sell orders</span>
            <span className="text-xl leading-none font-semibold text-red-400">
              {sellPct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-neutral-800 overflow-hidden flex">
          <div className="bg-green-500" style={{ width: `${buyPct}%` }}></div>
          <div className="bg-red-500" style={{ width: `${sellPct}%` }}></div>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="text-[12.5px] leading-tight">
          <table className="w-full border-separate">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="px-2 text-left font-medium w-[120px]">
                  Bid price
                </th>
                <th className="px-2 text-left font-medium w-[90px]">Qty</th>
                <th className="px-2"></th>
                <th className="px-2 text-left font-medium w-[120px]">
                  Ask price
                </th>
                <th className="px-2 text-left font-medium w-[90px]">Qty</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => {
                const bid = topBids[i];
                const ask = topAsks[i];
                const bidWidth = bid ? (bid.quantity / maxBidQty) * 100 : 0;
                const askWidth = ask ? (ask.quantity / maxAskQty) * 100 : 0;
                return (
                  <tr key={i} className="align-middle">
                    <td className="px-2 py-1 text-white/90">
                      {bid ? `${formatPrice(bid.price)}` : ""}
                    </td>
                    <td className="px-2 py-1 relative text-emerald-300 font-semibold">
                      {bid && (
                        <>
                          <div
                            className="absolute inset-y-0 left-0 rounded bg-emerald-600/25"
                            style={{ width: `${bidWidth}%` }}
                          />
                          <span className="relative z-10">
                            {formatQty(bid.quantity)}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="w-px">
                      <div className="h-full w-px bg-neutral-700 mx-auto" />
                    </td>
                    <td className="px-2 py-1 text-white/90">
                      {ask ? `${formatPrice(ask.price)}` : ""}
                    </td>
                    <td className="px-2 py-1 relative text-rose-300 font-semibold">
                      {ask && (
                        <>
                          <div
                            className="absolute inset-y-0 right-0 rounded bg-rose-500/25"
                            style={{ width: `${askWidth}%` }}
                          />
                          <span className="relative z-10">
                            {formatQty(ask.quantity)}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="text-xs text-muted-foreground">
                <td className="px-2 pt-2">Bid total</td>
                <td className="px-2 pt-2 font-medium text-white">
                  {formatQty(bidTotal)}
                </td>
                <td></td>
                <td className="px-2 pt-2">Ask total</td>
                <td className="px-2 pt-2 font-medium text-white">
                  {formatQty(askTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
          {!orderBook && (
            <div className="text-center text-xs text-muted-foreground mt-4">
              Loading depth…
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Depth;
