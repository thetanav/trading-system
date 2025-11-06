import Link from "next/link";
import { TrendingUp } from "lucide-react";
import Auth from "./Auth";

export const Nav = () => {
  return (
    <nav className="border-b flex items-center pl-10 justify-between w-full px-6 h-16 fixed top-0 left-0 right-0 backdrop-blur-sm z-10">
      <Link href="/">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TradeX
          </span>
        </div>
      </Link>
      <Auth />
    </nav>
  );
};
