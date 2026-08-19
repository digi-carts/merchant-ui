'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, TrendingUp, ShoppingBag, Package } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

interface DayData { date: string; orders: number; revenue: number }
interface ProductData { name: string; qty: number }
interface Analytics {
  ordersByDay: DayData[];
  topProducts: ProductData[];
  statusBreakdown: Record<string, number>;
  totalOrders: number;
  totalRevenue: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', PROCESSING: '#3b82f6', SHIPPED: '#8b5cf6',
  DELIVERED: '#22c55e', CANCELLED: '#ef4444',
};

const DAYS_OPTIONS = [7, 14, 30, 90];

function StatCard({ title, value, sub, icon: Icon, color }: Readonly<{ title: string; value: string; sub?: string; icon: React.ElementType; color: string }>) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
          <Icon size={15} className={color} />{title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const isDark = useIsDark();
  const grid = isDark ? '#3f3f3f' : '#f0f0f0';
  const tick = isDark ? '#a3a3a3' : '#737373';
  const ttStyle = { backgroundColor: isDark ? '#262626' : '#fff', border: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`, borderRadius: 8, fontSize: 12 };
  const ttLabel = { fontSize: 12, color: isDark ? '#e5e5e5' : '#171717' };

  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('₹');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/orders/analytics?days=${days}`),
      api.get('/store').catch(() => null),
    ]).then(([analyticsRes, storeRes]) => {
      setData(analyticsRes.data);
      const cur = storeRes?.data?.store?.currency || storeRes?.data?.store?.branding?.currency || 'INR';
      const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
      setCurrency(symbols[cur] || cur);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  const avgOrderValue = data && data.totalOrders > 0
    ? (data.totalRevenue / data.totalOrders).toFixed(2)
    : '0.00';

  const statusData = data
    ? Object.entries(data.statusBreakdown).map(([status, count]) => ({ name: status, value: count }))
    : [];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart2 size={22} className="text-neutral-400" />
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
        <div className="flex gap-1">
          {DAYS_OPTIONS.map(d => (
            <button key={d} type="button" onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${days === d ? 'bg-black text-white' : 'border border-neutral-200 text-neutral-600 hover:border-black'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-neutral-200 rounded-xl animate-pulse" />)}</div>}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Orders" value={String(data.totalOrders)} sub={`Last ${days} days`} icon={ShoppingBag} color="text-blue-500" />
            <StatCard title="Total Revenue" value={`${currency}${data.totalRevenue.toLocaleString()}`} sub={`Last ${days} days`} icon={TrendingUp} color="text-green-500" />
            <StatCard title="Avg Order Value" value={`${currency}${avgOrderValue}`} sub="Per order" icon={BarChart2} color="text-indigo-500" />
            <StatCard title="Top Product" value={data.topProducts[0]?.name || '—'} sub={data.topProducts[0] ? `${data.topProducts[0].qty} sold` : 'No sales yet'} icon={Package} color="text-orange-500" />
          </div>

          {/* Orders per day */}
          <Card>
            <CardHeader><CardTitle className="text-base">Orders Per Day</CardTitle></CardHeader>
            <CardContent>
              {data.ordersByDay.length === 0
                ? <p className="text-sm text-neutral-400 py-8 text-center">No orders in this period.</p>
                : <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.ordersByDay} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: tick }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 11, fill: tick }} width={28} />
                      <Tooltip formatter={(v) => [v, 'Orders']} labelFormatter={l => `Date: ${l}`} contentStyle={ttStyle} labelStyle={ttLabel} />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
              }
            </CardContent>
          </Card>

          {/* Revenue trend */}
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              {data.ordersByDay.length === 0
                ? <p className="text-sm text-neutral-400 py-8 text-center">No revenue data.</p>
                : <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.ordersByDay} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: tick }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 11, fill: tick }} width={40} tickFormatter={v => `${currency}${v}`} />
                      <Tooltip formatter={(v) => [`${currency}${Number(v).toFixed(2)}`, 'Revenue']} contentStyle={ttStyle} labelStyle={ttLabel} />
                      <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
              }
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top selling products */}
            <Card>
              <CardHeader><CardTitle className="text-base">Top Selling Products</CardTitle></CardHeader>
              <CardContent>
                {data.topProducts.length === 0
                  ? <p className="text-sm text-neutral-400 py-4 text-center">No sales yet.</p>
                  : <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.topProducts} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: tick }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: tick }} width={120} />
                        <Tooltip formatter={(v) => [v, 'Units sold']} contentStyle={ttStyle} labelStyle={ttLabel} />
                        <Bar dataKey="qty" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                }
              </CardContent>
            </Card>

            {/* Order status breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base">Order Status</CardTitle></CardHeader>
              <CardContent>
                {statusData.length === 0
                  ? <p className="text-sm text-neutral-400 py-4 text-center">No orders yet.</p>
                  : <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                          dataKey="value" nameKey="name" paddingAngle={3}>
                          {statusData.map(entry => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, n]} contentStyle={ttStyle} labelStyle={ttLabel} />
                        <Legend formatter={v => v} />
                      </PieChart>
                    </ResponsiveContainer>
                }
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
