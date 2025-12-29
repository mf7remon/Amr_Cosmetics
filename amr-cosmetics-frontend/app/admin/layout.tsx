"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    // not logged in -> send to login
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    // logged in but not admin -> send to account
    if (user?.role !== "ADMIN") {
      router.replace("/account");
    }
  }, [isLoggedIn, user?.role, router]);

  // While redirecting, show nothing (or loader)
  if (!isLoggedIn || user?.role !== "ADMIN") return null;

  return <>{children}</>;
}
