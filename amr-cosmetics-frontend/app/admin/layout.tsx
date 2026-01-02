"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    if (user?.role !== "ADMIN") {
      router.replace("/account");
    }
  }, [isLoggedIn, user?.role, router]);

  if (!isLoggedIn || user?.role !== "ADMIN") return null;

  return <>{children}</>;
}
