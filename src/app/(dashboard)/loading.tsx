import { RobotIllustration } from "@/components/brand/RobotIllustration";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5">
      <RobotIllustration size={96} alt="" className="animate-mascot-bounce" priority />
      <div className="text-center">
        <p className="text-sm font-bold text-foreground">Ачааллаж байна...</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Robo ажиллаж байна, түр хүлээнэ үү</p>
      </div>
      {/* Skeleton blocks below */}
      <div className="w-full max-w-5xl space-y-3 mt-4 animate-pulse">
        <div className="h-32 w-full rounded-[28px] bg-violet-100/60 dark:bg-violet-900/20" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-card border border-border" />
          ))}
        </div>
      </div>
    </div>
  );
}
