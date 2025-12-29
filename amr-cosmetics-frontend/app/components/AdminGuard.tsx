"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

type Props = {
  children: React.ReactNode;
};

export default function AdminGuard({ children }: Props) {
  const router = useRouter();

  // flexible auth shape
  const auth = useAuth() as unknown as {
    user?: { role?: string } | null;
    isLoggedIn?: boolean;
  };

  const role = auth?.user?.role;
  const isLoggedIn = auth?.isLoggedIn ?? Boolean(auth?.user);

  useEffect(() => {
    // only runs on client
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (role !== "ADMIN") {
      router.replace("/");
      return;
    }
  }, [isLoggedIn, role, router]);

  // Block UI until authorized (prevents flashing)
  if (!isLoggedIn || role !== "ADMIN") return null;

  return <>{children}</>;
}
