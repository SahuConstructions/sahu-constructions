"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "../../lib/auth";

export default function Page() {
  return <DashboardRedirect />;
}

function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const u = getUserFromToken();
    if (!u) {
      router.push("/");
    } else {
      switch (u.role) {
        case "USER":
          router.push("/dashboard/employee");
          break;
        case "MANAGER":
          router.push("/dashboard/manager");
          break;
        case "HR":
          router.push("/dashboard/hr");
          break;
        case "ADMIN":
          router.push("/dashboard/admin");
          break;
        case "FINANCE": // 👈 Add this case
          router.push("/dashboard/finance");
          break;
        default:
          router.push("/");
      }
    }
  }, [router]);

  return <div>Loading dashboard...</div>;
}
