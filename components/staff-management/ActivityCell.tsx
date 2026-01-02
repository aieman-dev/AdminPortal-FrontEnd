import { ACTIVITY_MAP, DEFAULT_ACTIVITY } from "@/config/activity-map";
import { UserActivity } from "@/type/activity-log";
import { getRelativeTime } from "@/lib/formatter"; 

interface ActivityCellProps {
  activity?: UserActivity; 
}

export function ActivityCell({ activity }: ActivityCellProps) {
  if (!activity) {
    return (
        <div className="flex w-full justify-center">
            <span className="text-muted-foreground/50 text-lg font-light select-none">
                —
            </span>
        </div>
    );
  }

  // 1. Lookup config (Safety: Fallback to DEFAULT if type not found)
  const config = ACTIVITY_MAP[activity.type] || DEFAULT_ACTIVITY;
  const Icon = config.icon;

  return (
    <div className="flex flex-col">
      {/* Description Line */}
      <span className="text-sm font-medium text-foreground truncate max-w-[220px]" title={activity.description}>
        {activity.description}
      </span>
      
      {/* Meta Line: Icon + Time */}
      <div className="flex items-center gap-2 mt-1">
        <div className={`flex items-center justify-center w-4 h-4 rounded-full ${config.bg}`}>
            <Icon className={`h-2.5 w-2.5 ${config.color}`} />
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">
            {getRelativeTime(activity.timestamp)}
        </span>
      </div>
    </div>
  );
}