"use client";

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";

interface Props {
  monthlyData: { month: string; revenue: number; enrollments: number; completed: number }[];
  courseStats: {
    id: string;
    title: string;
    enrollmentCount: number;
    completionRate: number;
    averageRating: number;
  }[];
}

export function InstructorCharts({ monthlyData, courseStats }: Props) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Revenue area chart */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Орлого (сүүлийн 6 сар)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}к` : v)}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v: number) => [`₮${v.toLocaleString()}`, "Орлого"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Enrollment vs completion */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Бүртгэл / Дүүргэлт</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="enrollments" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Бүртгэл" />
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Дүүргэсэн" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Courses performance bar chart */}
      <div className="bg-white rounded-xl border border-border p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground mb-4">Курсуудын гүйцэтгэл</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={courseStats}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="title"
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={140}
              tickFormatter={(v) => (v.length > 20 ? v.slice(0, 20) + "…" : v)}
            />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="enrollmentCount" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Бүртгэл" />
            <Bar dataKey="completionRate" fill="#10b981" radius={[0, 4, 4, 0]} name="Дүүргэлт %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
