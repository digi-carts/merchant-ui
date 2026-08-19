'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { getSubStatusCache, fetchSubStatus } from '../layout';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
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

interface SubStatus { subscribed: boolean; availableDays: number; expired: boolean; subscription: { name: string } | null }
interface Analytics {
  ordersByDay: { date: string; orders: number; revenue: number }[];
  topProducts: { name: string; qty: number }[];
  totalOrders: number;
  totalRevenue: number;
}
interface StockSummary {
  total: number; outOfStock: number; lowStock: number;
  topLow: { id: string; name: string; stock: number }[];
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
}
function shortDate(d: string) {
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}

export default function AdminDashboard() {
  const isDark = useIsDark();
  const grid = isDark ? '#3f3f3f' : '#f0f0f0';
  const tick = isDark ? '#a3a3a3' : '#737373';
  const bar1 = isDark ? '#e5e5e5' : '#171717';
  const bar2 = isDark ? '#737373' : '#737373';
  const areaStroke = isDark ? '#e5e5e5' : '#171717';
  const gradStop = isDark ? '#e5e5e5' : '#171717';

  const [store, setStore] = useState<{ name: string; published: boolean } | null>(null);
  const [sub, setSub] = useState<SubStatus | null>(() => getSubStatusCache());
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [chartDays, setChartDays] = useState<15 | 30>(30);
  const [stock, setStock] = useState<StockSummary | null>(null);
  const [inProgressOrders, setInProgressOrders] = useState(0);

  useEffect(() => {
    api.get('/store').then(r => setStore(r.data.store)).catch(() => {});
    fetchSubStatus().then(() => { const c = getSubStatusCache(); if (c) setSub(c); });
    api.get('/orders/active-count').then(r => setInProgressOrders((r.data.count as number) || 0)).catch(() => {});
    api.get('/catalog/products/stock-summary').then(r => setStock(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get(`/orders/analytics?days=${chartDays}`).then(r => setAnalytics(r.data)).catch(() => {});
  }, [chartDays]);

  const chartData = analytics?.ordersByDay.slice(-chartDays).map(d => ({
    date: shortDate(d.date), revenue: d.revenue, orders: d.orders,
  })) ?? [];
  const topProducts = analytics?.topProducts.slice(0, 6) ?? [];

  const storeCardClass = !store
    ? ''
    : store.published
      ? 'ring-2 ring-green-400 dark:ring-green-500 bg-green-50/60 dark:bg-green-950/40'
      : 'ring-2 ring-amber-400 dark:ring-amber-500 bg-amber-50/60 dark:bg-amber-950/40';

  const subCardClass = !sub
    ? ''
    : !sub.subscribed
      ? 'ring-2 ring-blue-300 dark:ring-blue-600 bg-blue-50/60 dark:bg-blue-950/40'
      : sub.expired
        ? 'ring-2 ring-red-400 dark:ring-red-500 bg-red-50/60 dark:bg-red-950/40'
        : sub.availableDays <= 7
          ? 'ring-2 ring-orange-400 dark:ring-orange-500 bg-orange-50/60 dark:bg-orange-950/40'
          : 'ring-2 ring-green-400 dark:ring-green-500 bg-green-50/60 dark:bg-green-950/40';

  const subDaysClass = !sub
    ? ''
    : !sub.subscribed ? 'text-blue-500' : sub.expired ? 'text-red-600' : sub.availableDays <= 7 ? 'text-orange-500' : 'text-green-600';

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`relative overflow-hidden ${storeCardClass}`}>
          {store && (
            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${store.published ? 'bg-green-400 dark:bg-green-500' : 'bg-amber-400 dark:bg-amber-500'}`} />
          )}
          <CardHeader className="pb-1"><CardTitle className="text-xs text-neutral-500 uppercase tracking-wide">Store</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold truncate">{store?.name ?? '—'}</p>
            {store && (
              <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${store.published ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${store.published ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                {store.published ? 'Live' : 'Draft'}
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-neutral-500 uppercase tracking-wide">Revenue ({chartDays}d)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics ? fmt(analytics.totalRevenue) : '—'}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{analytics?.totalOrders ?? '—'} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-neutral-500 uppercase tracking-wide">In Progress Orders</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${inProgressOrders > 0 ? 'text-orange-500' : ''}`}>{inProgressOrders}</p>
            <Link href="/orders" className="text-xs text-neutral-400 hover:text-black dark:hover:text-white">View all →</Link>
          </CardContent>
        </Card>

        <Card className={`relative overflow-hidden ${subCardClass}`}>
          {sub && (
            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
              !sub.subscribed ? 'bg-blue-400 dark:bg-blue-500' :
              sub.expired ? 'bg-red-400 dark:bg-red-500' :
              sub.availableDays <= 7 ? 'bg-orange-400 dark:bg-orange-500' : 'bg-green-400 dark:bg-green-500'
            }`} />
          )}
          <CardHeader className="pb-1"><CardTitle className="text-xs text-neutral-500 uppercase tracking-wide">Subscription</CardTitle></CardHeader>
          <CardContent>
            {sub ? (
              <>
                <p className={`text-2xl font-bold ${subDaysClass}`}>
                  {!sub.subscribed ? 'None' : sub.expired ? 'Expired' : `${sub.availableDays}d`}
                </p>
                <p className="text-xs text-neutral-500 truncate">{sub.subscription?.name ?? (!sub.subscribed ? 'No plan yet' : 'No plan')}</p>
                <Link href="/subscription" className="text-xs underline text-neutral-400 hover:text-black dark:hover:text-white mt-0.5 inline-block">
                  {!sub.subscribed ? 'Start subscription →' : sub.expired ? 'Renew →' : 'Manage →'}
                </Link>
              </>
            ) : <p className="text-sm text-neutral-400">—</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Charts</p>
          <div className="flex gap-1">
            {([15, 30] as const).map(d => (
              <button key={d} type="button" onClick={() => setChartDays(d)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${chartDays === d ? 'bg-black text-white dark:bg-white dark:text-black' : 'border border-neutral-200 text-neutral-500 hover:border-black dark:border-neutral-700 dark:hover:border-white'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue Trend <span className="font-normal text-neutral-400">(last {chartDays} days)</span></CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gradStop} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={gradStop} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v as number)} width={50} />
                  <Tooltip formatter={(v) => [fmt(v as number), 'Revenue']} labelStyle={{ fontSize: 12, color: isDark ? '#e5e5e5' : '#171717' }} contentStyle={{ backgroundColor: isDark ? '#262626' : '#fff', border: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`, borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke={areaStroke} strokeWidth={2} fill="url(#revGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-[180px] flex items-center justify-center text-sm text-neutral-400">No data yet</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Order Volume <span className="font-normal text-neutral-400">(last {chartDays} days)</span></CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                  <Tooltip formatter={(v) => [v, 'Orders']} labelStyle={{ fontSize: 12, color: isDark ? '#e5e5e5' : '#171717' }} contentStyle={{ backgroundColor: isDark ? '#262626' : '#fff', border: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`, borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="orders" fill={bar1} radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[180px] flex items-center justify-center text-sm text-neutral-400">No data yet</div>}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Top products + Stock summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Products <span className="font-normal text-neutral-400">(units sold)</span></CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} width={100}
                    tickFormatter={v => (v as string).length > 14 ? `${(v as string).slice(0, 13)}…` : v} />
                  <Tooltip formatter={(v) => [v, 'Units']} labelStyle={{ fontSize: 12, color: isDark ? '#e5e5e5' : '#171717' }} contentStyle={{ backgroundColor: isDark ? '#262626' : '#fff', border: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`, borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="qty" fill={bar2} radius={[0, 3, 3, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[180px] flex items-center justify-center text-sm text-neutral-400">No sales yet</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Stock Summary</CardTitle>
              <Link href="/stock" className="text-xs text-neutral-400 hover:text-black dark:hover:text-white">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {stock ? (
              <>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stock.total}</p>
                    <p className="text-xs text-neutral-500">Products</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${stock.outOfStock > 0 ? 'text-red-500' : ''}`}>{stock.outOfStock}</p>
                    <p className="text-xs text-neutral-500">Out of stock</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${stock.lowStock > 0 ? 'text-orange-500' : ''}`}>{stock.lowStock}</p>
                    <p className="text-xs text-neutral-500">Low (≤5)</p>
                  </div>
                </div>
                {stock.topLow.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Lowest stock</p>
                    {stock.topLow.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="truncate text-neutral-700 dark:text-neutral-300 max-w-[72%]">{p.name}</span>
                        <span className={`font-semibold tabular-nums ${p.stock === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                          {p.stock === 0 ? 'Out' : p.stock}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : <div className="h-[120px] flex items-center justify-center text-sm text-neutral-400">Loading…</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
