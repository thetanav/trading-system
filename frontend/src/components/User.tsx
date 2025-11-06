"use client";

import axios from "axios";
import { User as UserType } from "../types";
import { useEffect, useState } from "react";

const apiURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const UserList = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  useEffect(() => {
    function fetchUsers() {
      axios.get(apiURL + "/users").then((res) => {
        setUsers(res.data);
      });
    }

    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="">
      <div className="py-4">
        <h2 className="text-lg font-bold text-center">Users</h2>
      </div>
      <div className="overflow-x-auto p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted text-muted-foreground">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">
                Name
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Stock Holdings
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Cash Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border hover:bg-muted/60 transition-colors">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                  {user.name}
                </th>
                <td className="px-6 py-4 font-mono">{user.stock}</td>
                <td className="px-6 py-4 font-mono">
                  ${user.cash.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
