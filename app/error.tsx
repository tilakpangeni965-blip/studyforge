"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl items-center justify-center py-16">
      <EmptyState
        icon="⚠️"
        title="Something went wrong"
        description="An error occurred while loading this page. Please try again."
        action={<Button onClick={() => reset()}>Try again</Button>}
      />
    </div>
  );
}
