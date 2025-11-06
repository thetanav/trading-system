"use client";

import axios from "axios";
import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const Quote = () => {
  const [price, setPrice] = useState<any>();

  function fetchQuote() {
    axios.get(apiURL + "/quote").then((res) => {
      if (res.data.ok) {
        setPrice(res.data.data);
      } else {
        setPrice("⚠️");
      }
    });
  }

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <div className="flex gap-2 items-center justify-center">
      <p className="text-lg font-bold font-mono tracking-tight">
        Market Price: {price}
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={fetchQuote}
        aria-label="Refresh quote">
        <RefreshCcw className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default Quote;
