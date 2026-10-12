import { SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-8">
      {Array.from({ length: 2 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
