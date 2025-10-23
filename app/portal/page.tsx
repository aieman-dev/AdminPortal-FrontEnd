import { PageHeader } from "@/components/portal/page-header"
import { StatCard } from "@/components/portal/stat-card"
import { Card } from "@/components/ui/card"
import { Users, Activity, TrendingUp, Clock } from "lucide-react"

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your workspace and key metrics" />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Users"
          value="2,543"
          description="Active users"
          icon={Users}
          trend={{ value: "12.5%", positive: true }}
        />
        <StatCard
          title="Activity"
          value="1,234"
          description="This month"
          icon={Activity}
          trend={{ value: "8.2%", positive: true }}
        />
        <StatCard
          title="Growth"
          value="23.5%"
          description="Year over year"
          icon={TrendingUp}
          trend={{ value: "4.3%", positive: true }}
        />
        <StatCard title="Avg. Time" value="4.2h" description="Per session" icon={Clock} />
      </div>

      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Activity Item {i}</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-4 rounded-lg border hover:bg-accent transition-colors">
              <p className="font-medium text-sm">Create New Project</p>
              <p className="text-xs text-muted-foreground mt-1">Start a new project from scratch</p>
            </button>
            <button className="w-full text-left p-4 rounded-lg border hover:bg-accent transition-colors">
              <p className="font-medium text-sm">Invite Team Members</p>
              <p className="text-xs text-muted-foreground mt-1">Add collaborators to your workspace</p>
            </button>
            <button className="w-full text-left p-4 rounded-lg border hover:bg-accent transition-colors">
              <p className="font-medium text-sm">View Reports</p>
              <p className="text-xs text-muted-foreground mt-1">Access detailed analytics and insights</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
