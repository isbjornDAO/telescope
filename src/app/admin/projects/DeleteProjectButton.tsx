'use client';

import { Button } from "@/components/ui/button";

interface DeleteProjectButtonProps {
  projectId: string;
}

export function DeleteProjectButton({ projectId }: DeleteProjectButtonProps) {
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          window.location.reload();
        } else {
          alert('Failed to delete project');
        }
      } catch {
        alert('Error deleting project');
      }
    }
  };

  return (
    <Button variant="destructive" onClick={handleDelete}>
      Delete
    </Button>
  );
} 