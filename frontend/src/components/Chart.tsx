"use client";

import axios from "axios";
import { RefreshCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { createChart, CandlestickData } from "lightweight-charts";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Chart() {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  function fetchChartData() {
    axios.get(apiURL + "/chart").then((res) => {
      setChartData(res.data);
      console.log("Chart data fetched:", res.data);
    });
  }

  useEffect(() => {
    fetchChartData();
  }, []);

  useEffect(() => {
    if (chartContainerRef.current && chartData.length > 0) {
      if (chartRef.current) {
        chartRef.current.remove();
      }
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { color: "#ffffff" },
          textColor: "#333",
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
      candlestickSeries.setData(chartData);

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
  }, [chartData]);

  const lastPrice =
    chartData.length > 0 ? chartData[chartData.length - 1].close : "N/A";

  return (
    <div className="w-full">
      <div className="flex gap-2 items-center justify-center mb-4">
        <p className="text-lg font-bold font-mono tracking-tight text-green-600">
          Last Price: {lastPrice}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchChartData}
          aria-label="Refresh chart">
          <RefreshCcw className="w-5 h-5" />
        </Button>
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
}
