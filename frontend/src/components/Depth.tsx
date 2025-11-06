"use client";

import { useEffect, useMemo, useState } from "react";
import { Orderbook, AnonyOrder } from "../types";
import { Zap } from "lucide-react";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;
const wsURL = process.env.NEXT_PUBLIC_WS_URL!;

const Depth = () => {
  const [orderBook, setOrderBook] = useState<Orderbook | null>(null);

  useEffect(() => {
    let ws: WebSocket;

    const connectToWebSocket = () => {
      ws = new WebSocket(wsURL);

      ws.onopen = () => {
        // console.log("Listening Orderbook");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "orderbook") {
            setOrderBook(message.data);
          }
        } catch (error) {
          // console.error("Error parsing message:", error);
        }
      };
    };

    const fetchOrderbook = async () => {
      try {
        const res = await fetch(apiURL + "/orderbook");
        const data = await res.json();
        if (data.ok) {
          setOrderBook(data.data);
        }
      } catch (error) {
        // console.error("Failed to fetch order book", error);
      }
      connectToWebSocket();
    };

    fetchOrderbook();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Find the maximum order size for percentage bars
  const maxOrderSize = useMemo(() => {
    if (!orderBook) return 1;
    const allSizes = [...(orderBook.asks || []), ...(orderBook.bids || [])].map(
      (order) => order.quantity
    );
    return Math.max(...allSizes, 1);
  }, [orderBook]);

  const renderOrderRow = (order: AnonyOrder, side: "ask" | "bid") => {
    const percentage = (order.quantity / maxOrderSize) * 100;
    const bgColor = side === "ask" ? "bg-red-400/20" : "bg-green-600/20";
    const barSide = side === "ask" ? "right-0" : "left-0";
    const textColor = side === "ask" ? "text-red-400" : "text-green-400";

    return (
      <tr key={order.price} className={`relative font-semibold text-sm`}>
        {side === "ask" ? (
          <>
            <td className="w-32 relative p-0">
              <div
                className={`absolute top-0 bottom-0 ${bgColor} ${barSide} h-full rounded-l-md`}
                style={{ width: `${percentage}%` }}></div>
            </td>
            <td className={`px-4 py-2 relative z-10 text-white/70 ${bgColor}`}>
              {order.quantity}
            </td>
            <td className={`px-4 py-2 relative z-10 ${textColor} ${bgColor}`}>
              ${order.price}
            </td>
          </>
        ) : (
          <>
            <td className={`px-4 py-2 relative z-10 ${textColor} ${bgColor}`}>
              ${order.price}
            </td>
            <td className={`px-4 py-2 relative z-10 text-white/70 ${bgColor}`}>
              {order.quantity}
            </td>
            <td className="w-32 relative p-0">
              <div
                className={`absolute top-0 bottom-0 ${bgColor} ${barSide} h-full rounded-r-md`}
                style={{ width: `${percentage}%` }}></div>
            </td>
          </>
        )}
      </tr>
    );
  };

  return (
    <div>
      <div className="py-4 flex items-center justify-center gap-1">
        <h2 className="text-xl font-bold">Orderbook</h2>
        <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400 mx-2 animate-bounce" />
      </div>
      <div className="flex flex-col items-center px-2">
        <div className="flex flex-row w-full justify-center items-start h-[60vh] overflow-y-auto">
          {/* Sell Orders (Asks) */}
          <table className="min-w-[300px] text-sm overflow-hidden">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground">
                <th className="w-16"></th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Sell (Ask)</th>
              </tr>
            </thead>
            <tbody>
              {orderBook?.asks?.length ? (
                orderBook.asks
                  .slice(0, 10)
                  .map((ask) => renderOrderRow(ask, "ask"))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-2 text-muted-foreground/50">
                    No ask orders available
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Buy Orders (Bids) */}
          <table className="min-w-[300px] text-sm overflow-hidden">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2">Buy (Bid)</th>
                <th className="px-4 py-2">Size</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {orderBook?.bids?.length ? (
                orderBook.bids
                  .slice(0, 10)
                  .map((bid) => renderOrderRow(bid, "bid"))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-2 text-muted-foreground/50">
                    No bid orders available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Depth;
