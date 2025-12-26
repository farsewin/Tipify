'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';

interface DailyTipsData {
  name: string;
  tips: number;
  count: number;
}

interface WeeklyTipsData {
  name: string;
  tips: number;
  count: number;
}

interface DashboardChartsProps {
  dailyTipsData: DailyTipsData[];
  weeklyTipsData: WeeklyTipsData[];
}

export default function DashboardCharts({
  dailyTipsData,
  weeklyTipsData,
}: DashboardChartsProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Daily Tips Trend</CardTitle>
          <CardDescription>Tip amounts over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTipsData}>
                <defs>
                  <linearGradient id="tipGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(161 93% 30%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(161 93% 30%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                  }}
                  formatter={(value: number) => [`QAR ${value.toFixed(0)}`, 'Tips']}
                />
                <Area
                  type="monotone"
                  dataKey="tips"
                  stroke="hsl(161 93% 30%)"
                  strokeWidth={2}
                  fill="url(#tipGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Comparison</CardTitle>
          <CardDescription>Tips collected over the last 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTipsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                  }}
                  formatter={(value: number) => [`QAR ${value.toFixed(0)}`, 'Tips']}
                />
                <Bar
                  dataKey="tips"
                  fill="hsl(280 70% 55%)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

