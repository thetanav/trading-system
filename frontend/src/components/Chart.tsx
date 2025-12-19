"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickData } from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const { data, isPending } = useQuery({
    queryKey: ["chart"],
    queryFn: async () => await api<CandlestickData[]>("/trade/chart"),
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
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
          background: { color: "#1E222D" },
          textColor: "#E0E0E0",
        },
        grid: {
          vertLines: { color: "#e1e1e1" },
          horzLines: { color: "#e1e1e1" },
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
      <div className="flex justify-end mb-4 mr-4">
        <p className="text-2xl font-black text-green-400">${lastPrice}</p>
      </div>
      {isPending && <p>Loading chart...</p>}
      <div
        ref={chartContainerRef}
        className="w-full h-[500px] border rounded-xl cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
