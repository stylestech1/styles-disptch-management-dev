"use client";

import { useParams, notFound } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import Loading from "@/components/ui/Loading";
import UserProfile from "@/components/profile/UserProfile";
import { useEffect, useState } from "react";

export default function AdminProfilePage() {
  const { id } = useParams();
  const user = useAppSelector((state) => state.auth.user);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsChecking(false);
      return;
    }

    if (!id || id !== user.id) {
      notFound();
    }

    setIsChecking(false);
  }, [id, user]);

  if (isChecking) return <Loading />;

  return <UserProfile />;
}
