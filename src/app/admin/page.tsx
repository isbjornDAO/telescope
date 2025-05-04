"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ProjectList } from "@/components/admin/ProjectList";

const ADMIN_ADDRESS = "0xA0338CD77f6eDD8a2f8670EeD4BC21CF908Ab918";

export default function AdminPage() {
  const { address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (address && address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
      router.push("/");
    }
  }, [address, router]);

  if (!address || address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-screen-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => router.push("/admin/projects/new")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      <ProjectList />
    </div>
  );
}
