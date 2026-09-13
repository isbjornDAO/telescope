"use client";

import { ProjectForm } from "@/components/admin/ProjectForm";
import { AdminWrapper } from "@/components/admin/AdminWrapper";

export default function NewProjectPage() {
  return (
    <AdminWrapper>
      <div className="w-full space-y-4 pb-12">
        <ProjectForm mode="create" />
      </div>
    </AdminWrapper>
  );
}
