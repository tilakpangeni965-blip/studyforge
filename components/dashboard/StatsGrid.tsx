import { Card } from "@/components/ui/Card";
import { stats } from "@/lib/dashboard-data";

export function StatsGrid() {
  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        Study stats
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.id}
            as="article"
            className="transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
              <span className="text-base" aria-hidden="true">
                {stat.icon}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{stat.hint}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
