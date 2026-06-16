"use client";

import { useUser } from "@/components/context/UserContext";
import { useUrlParam } from "@/hooks/useUrlParam";
import AuthorizedFollowUpProfile from "@/components/dashboard/Admin/AuthorizedFollowUpProfile";

export default function AuthorizedProfilePage() {
  const { user } = useUser();
  const adminId = useUrlParam(1); // .../authorized/<id>/profile

  if (user && user.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
      </div>
    );
  }

  return <AuthorizedFollowUpProfile adminId={adminId} />;
}
