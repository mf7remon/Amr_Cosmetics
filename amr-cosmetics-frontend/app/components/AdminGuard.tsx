"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

type Props = {
  children: React.ReactNode;
};

export default function AdminGuard({ children }: Props) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    if (user?.role !== "ADMIN") {
      router.replace("/");
      return;
    }
  }, [isLoggedIn, user?.role, router]);

  if (!isLoggedIn || user?.role !== "ADMIN") return null;

  return <>{children}</>;
}
