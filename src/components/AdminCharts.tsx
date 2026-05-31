import { Activity, IndianRupee } from "lucide-react";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface AdminChartsProps {
  bookings: any[];
}

export default function AdminCharts({ bookings }: AdminChartsProps) {

  // Build real admissions data grouped by day of week (last 7 days)
  const admissionsData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: { [key: string]: number } = {};
    const orderedDays: string[] = [];

    // Build last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = dayNames[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      counts[dateStr] = 0;
      orderedDays.push(dateStr);
    }

    bookings.forEach(b => {
      try {
        const bDate = new Date(b.date).toISOString().split('T')[0];
        if (counts[bDate] !== undefined) {
          counts[bDate]++;
        }
      } catch {}
    });

    return orderedDays.map(dateStr => {
      const d = new Date(dateStr);
      return {
        day: dayNames[d.getDay()],
        admissions: counts[dateStr],
      };
    });
  }, [bookings]);

  // Build real revenue data grouped by month (last 6 months)
  const revenueData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthTotals: { month: string; revenue: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = monthNames[d.getMonth()];

      let total = 0;
      bookings.forEach(b => {
        try {
          const bDate = new Date(b.date);
          const bKey = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}`;
          if (bKey === key) {
            total += Number(b.amount) || 0;
          }
        } catch {}
      });

      monthTotals.push({ month: monthLabel, revenue: total });
    }

    return monthTotals;
  }, [bookings]);

  const maxAdmission = Math.max(...admissionsData.map(d => d.admissions), 10);
  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1000);

  return (
    <div className="mt-2 space-y-6">

      {/* Daily Bookings Chart */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-serif font-bold text-slate-800">Bookings This Week</h3>
            <p className="text-sm text-slate-500 mt-1">Real-time slot bookings for the last 7 days.</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100/50">
            <Activity className="w-5 h-5 text-teal-500" />
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={admissionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 13 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 13 }}
                domain={[0, Math.ceil(maxAdmission * 1.2)]}
                allowDecimals={false}
              />
              <RechartsTooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#E5E7EB', strokeWidth: 2, strokeDasharray: '5 5' }}
              />
              <Line
                type="natural"
                dataKey="admissions"
                stroke="#2DD4BF"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2DD4BF", stroke: "white", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#2DD4BF", stroke: "white", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-serif font-bold text-slate-800">Revenue Trend (₹)</h3>
            <p className="text-sm text-slate-500 mt-1">Monthly revenue from booked slots in Rupees.</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100/50">
            <IndianRupee className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="transparent" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 13 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 13 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                domain={[0, Math.ceil(maxRevenue * 1.2)]}
              />
              <RechartsTooltip
                cursor={{ fill: '#F3F4F6' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 flex flex-col gap-1">
                        <p className="text-gray-900 font-medium">{label}</p>
                        <p className="text-blue-500 font-medium text-sm">
                          ₹{Number(payload[0].value).toLocaleString('en-IN')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="revenue"
                radius={[6, 6, 6, 6]}
                barSize={40}
              >
                {revenueData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#60A5FA" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
