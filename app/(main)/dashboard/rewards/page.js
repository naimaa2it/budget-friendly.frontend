"use client";

import { useUser } from "@/components/context/UserContext";
import RewardsOverview from "@/components/dashboard/Rewards/RewardsOverview";

export default function RewardsPage() {
  const { user } = useUser();
  if (user && user.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
      </div>
    );
  }
  return <RewardsOverview />;
}
