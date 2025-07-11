import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";

export default function Auth() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  if (token == "") {
    return (
      <div>
        <Button
          asChild
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white outline-none">
          <Link to="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Button
        asChild
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
        <Link to="/dashboard">Dashboard</Link>
      </Button>
      <Button
        variant={"destructive"}
        onClick={() => {
          localStorage.setItem("token", "");
          navigate({ to: "/" });
        }}>
        Signout
      </Button>
    </div>
  );
}
