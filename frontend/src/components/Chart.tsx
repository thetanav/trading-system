"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickData } from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const { data, isPending } = useQuery({
    queryKey: ["chart"],
    queryFn: async () => await api<CandlestickData[]>("/trade/chart"),
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (chartContainerRef.current && data && data.length > 0) {
      if (chartRef.current) {
        chartRef.current.remove();
      }
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: {
          background: { color: "#000000" },
          textColor: "#eee",
        },
        grid: {
          vertLines: { color: "#545454" },
          horzLines: { color: "#545454" },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      const candlestickSeries = (chart as any).addCandlestickSeries();
      candlestickSeries.setData(data);

      chartRef.current = chart;

      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    }
  }, [data]);

  const lastPrice =
    data && data.length > 0 ? data[data.length - 1].close : "N/A";

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4 mx-4">
        <div>
          <h3 className="text-2xl font-bold">TNV</h3>
        </div>
        <div className="flex items-center gap-3">
          {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
          <p className="text-2xl font-bold text-green-400">${lastPrice}</p>
        </div>
      </div>
      <div
        ref={chartContainerRef}
        className="w-full h-[500px] border rounded-xl cursor-grab active:cursor-grabbing overflow-hidden"
      />
    </div>
  );
}
