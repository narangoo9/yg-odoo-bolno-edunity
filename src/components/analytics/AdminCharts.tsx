"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Star } from "lucide-react";

interface AdminChartsProps {
  revenueData: { month: string; revenue: number; count: number }[];
  enrollmentData: { month: string; enrollments: number; completed: number }[];
  userGrowthData: { month: string; total: number; students: number; instructors: number }[];
  topCourses: {
    id: string; title: string; instructorName: string;
    enrollmentCount: number; averageRating: number; price: number;
  }[];
}

export function AdminCharts({ revenueData, enrollmentData, userGrowthData, topCourses }: AdminChartsProps) {
  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Орлогын динамик</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}к` : v} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                formatter={(v: number) => [`₮${v.toLocaleString()}`, "Орлого"]}
              />
              <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Enrollment chart */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Бүртгэлийн динамик</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={enrollmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="enrollments" stroke="#3b82f6" strokeWidth={2} dot={false} name="Бүртгэл" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name="Дүүргэсэн" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User growth */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Хэрэглэгчийн өсөлт</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={userGrowthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="students" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Оюутан" stackId="a" />
              <Bar dataKey="instructors" fill="#8b5cf6" radius={[2, 2, 0, 0]} name="Багш" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top courses */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Шилдэг курсууд</h3>
          <div className="space-y-3">
            {topCourses.map((course, i) => (
              <div key={course.id} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                  <p className="text-xs text-muted-foreground/80">{course.instructorName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">{course.enrollmentCount}</p>
                  <div className="flex items-center gap-0.5 justify-end">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-muted-foreground">{course.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
