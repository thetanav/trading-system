import Depth from "../../components/Depth";
import MakeOrder from "../../components/MakeOrder";
import Balance from "../../components/Balance";
import { toast } from "sonner";
import Transactions from "../../components/Transactions";
import { Nav } from "../../components/Navbar";
import Chart from "@/components/Chart";
import CheckAuth from "@/components/CheckAuth";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <CheckAuth />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Orderbook - spans 6 columns on large screens */}
          <div className="lg:col-span-6">
            <Chart />
            <Depth />
          </div>

          {/* Right sidebar - spans 6 columns on large screens */}
          <div className="lg:col-span-6 space-y-6">
            {/* <Balance /> */}
            <MakeOrder />
            <Transactions />
          </div>
        </div>
      </div>
    </div>
  );
}
