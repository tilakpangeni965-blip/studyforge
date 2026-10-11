"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl items-center justify-center py-16">
      <EmptyState
        icon="🔍"
        title="Page not found"
        description="The page you're looking for doesn't exist. It may have moved or the URL is incorrect."
        action={
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
