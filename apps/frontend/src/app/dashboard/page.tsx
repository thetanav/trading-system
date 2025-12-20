import Depth from "../../components/Depth";
import MakeOrder from "../../components/MakeOrder";
import Profile from "../../components/Profile";
import Transactions from "../../components/Transactions";
import Chart from "@/components/Chart";

export default function Dashboard() {
  return (
    <div className="px-4 py-6">
      <div className="flex gap-4">
        <div className="flex-2 flex flex-col gap-4">
          <Chart />
          <Transactions />
        </div>
        <div className="flex-1 flex flex-col gap-4 w-96">
          <Profile />
          <MakeOrder />
          <Depth />
        </div>
      </div>
    </div>
  );
}
