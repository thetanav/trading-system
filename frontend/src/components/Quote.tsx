"use client";

import axios from "axios";
import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const Quote = () => {
  const [chartData, setChartData] = useState<any[]>([]);

  function fetchChartData() {
    axios.get(apiURL + "/chart").then((res) => {
      if (res.data.ok) {
        setChartData(res.data.data);
      } else {
        setChartData([]);
      }
    });
  }

  useEffect(() => {
    fetchChartData();
  }, []);

  const lastPrice =
    chartData.length > 0 ? chartData[chartData.length - 1].price : "N/A";

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
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Quote;
