import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl items-center justify-center py-16">
      <EmptyState
        icon="📚"
        title="Tutor conversation not found"
        description="This tutoring conversation could not be found. Return to your dashboard and open the tutor again."
        action={
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
