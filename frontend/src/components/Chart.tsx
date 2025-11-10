"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickData } from "lightweight-charts";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Chart() {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  function fetchChartData() {
    setLoading(true);
    setError(null);
    axios
      .get(apiURL + "/trade/chart")
      .then((res) => {
        setChartData(res.data);
        console.log("Chart data fetched:", res.data);
      })
      .catch((err) => {
        console.error("Error fetching chart data:", err);
        setError("Failed to load chart data");
      })
      .finally(() => {
        setLoading(false);
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
      <div className="flex justify-end mb-4 mr-4">
        <p className="text-2xl font-black text-green-400">${lastPrice}</p>
      </div>
      {loading && <p>Loading chart...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div
        ref={chartContainerRef}
        className="w-full h-[500px] border rounded-xl"
      />
    </div>
  );
}
