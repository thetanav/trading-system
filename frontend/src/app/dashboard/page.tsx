import Depth from "../../components/Depth";
import MakeOrder from "../../components/MakeOrder";
import Balance from "../../components/Balance";
import { toast } from "sonner";
import Transactions from "../../components/Transactions";
import { Nav } from "../../components/Navbar";
import Chart from "@/components/Chart";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2">
          {/* Orderbook - spans 6 columns on large screens */}
          <div className="flex-2 flex flex-col gap-2">
            <Chart />
            <Transactions />
          </div>

          {/* Right sidebar - spans 6 columns on large screens */}
          <div className="flex-1 flex flex-col gap-2">
            <Balance />
            <MakeOrder />
            <Depth />
          </div>
        </div>
      </div>
    </div>
  );
}
