import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { formatINR, formatCompactINR } from '../utils/format';

const DONUT_SHADES = [
  '#3B1786',
  '#5D2EC2',
  '#7C51DA',
  '#9A72EC',
  '#B695F5',
  '#CBB5FA',
  '#DED0FD',
  '#8B4CB8',
];

function CustomDonutTooltip({ active, payload, metric, groomName, brideName }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const metricLabel = metric === 'spend' ? 'Total Cost' : 'Category Budget';

  return (
    <div className="rounded-xl bg-royal-900/95 px-3.5 py-2.5 text-xs text-white shadow-xl border border-royal-400/30">
      <div className="flex items-center gap-2 font-semibold">
        <span
          className="inline-block h-2.5 w-2.5 rounded-[3px]"
          style={{ backgroundColor: item.color }}
        />
        <span>{item.name}</span>
      </div>
      <div className="mt-1.5 space-y-0.5 tabular-nums text-royal-100">
        <p>
          {metricLabel}: <strong className="text-white">{formatINR(item.value)}</strong> ({item.sharePct}%)
        </p>
        <p>
          Paid: <strong className="text-emerald-300">{formatINR(item.paid)}</strong>
        </p>
        <p className="text-[11px] text-royal-200 pt-0.5">
          {groomName} {formatINR(item.harshaPaid || 0)} · {brideName} {formatINR(item.divyaPaid || 0)}
        </p>
      </div>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label, groomName, brideName }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  const fullLabel = row.fullName || label;
  return (
    <div className="rounded-xl bg-white px-3.5 py-2.5 text-xs text-ink shadow-xl border border-royal-200">
      <p className="font-semibold text-royal-900 mb-1.5">{fullLabel}</p>
      <div className="space-y-1 tabular-nums">
        {row.BudgetCap > 0 && (
          <div className="flex items-center justify-between gap-4 text-ink-subtle">
            <span>Budget Cap</span>
            <span className="font-medium text-ink">{formatINR(row.BudgetCap)}</span>
          </div>
        )}
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span
                className="inline-block h-2.5 w-2.5 rounded-[3px]"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-ink">{formatINR(entry.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-royal-100">
          <span className="text-amber-700 font-medium">Balance Due</span>
          <span className="font-semibold text-amber-800">{formatINR(row.Balance || 0)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-royal-100 text-[11px] text-ink-muted">
          <span>
            {groomName}: <strong className="text-[#4C1D95]">{formatINR(row.HarshaPaid || 0)}</strong>
          </span>
          <span>
            {brideName}: <strong className="text-[#86198F]">{formatINR(row.DivyaPaid || 0)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ChartsSection({
  categoryStats,
  totalActual,
  selectedCategoryId,
  onSelectCategory,
  groomName = 'Groom',
  brideName = 'Bride',
}) {
  const [donutMetric, setDonutMetric] = useState('spend');

  const totalBudgetCaps = categoryStats.reduce(
    (sum, c) => sum + Number(c.budgetCap || 0),
    0
  );

  const metricTotal = donutMetric === 'spend' ? totalActual : totalBudgetCaps;

  const allLegendItems = categoryStats
    .map((c, idx) => {
      const value = donutMetric === 'spend' ? c.actual : Number(c.budgetCap || 0);
      return {
        id: c.id,
        name: c.name,
        color: c.color || DONUT_SHADES[idx % DONUT_SHADES.length],
        value,
        paid: c.paid,
        harshaPaid: c.harshaPaid || 0,
        divyaPaid: c.divyaPaid || 0,
        sharePct: metricTotal > 0 ? ((value / metricTotal) * 100).toFixed(1) : '0.0',
      };
    })
    .sort((a, b) => b.value - a.value);

  const donutSlices = allLegendItems.filter((d) => d.value > 0);

  const barData = categoryStats.map((c) => {
    const shortName = c.name.split('(')[0].trim();
    return {
      name: shortName.length > 11 ? `${shortName.slice(0, 10)}…` : shortName,
      fullName: c.name,
      BudgetCap: Number(c.budgetCap || 0),
      'Total Cost': c.actual,
      Paid: c.paid,
      HarshaPaid: c.harshaPaid || 0,
      DivyaPaid: c.divyaPaid || 0,
      Balance: c.balance,
    };
  });

  const centerSubtitle = donutMetric === 'spend' ? 'Spent' : 'Allocated';
  const needsHorizontalScroll = barData.length > 10;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left 3D Card: Expense Breakdown (Donut + Clean Side Legend) */}
      <div className="lg:col-span-6 rounded-2xl card-3d p-6 border border-royal-200/90 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-ink">
            Expense Breakdown
          </h2>

          <div className="inline-flex rounded-xl bg-royal-50 p-1 border border-royal-200/80 text-xs font-semibold">
            {[
              { key: 'spend', label: 'Spend' },
              { key: 'budget', label: 'Budget' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDonutMetric(tab.key)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  donutMetric === tab.key
                    ? 'btn-3d-primary text-white'
                    : 'text-ink-muted hover:text-royal-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {allLegendItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-ink-subtle">
            <PieIcon className="h-9 w-9 mb-2 opacity-40" />
            <p className="text-sm">Add categories and expenses to view your wedding breakdown</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 py-1">
            {/* 3D Donut Chart */}
            <div className="relative h-56 w-56 shrink-0 chart-3d-glow">
              {donutSlices.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutSlices}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={98}
                      paddingAngle={2}
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {donutSlices.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={entry.color}
                          className="cursor-pointer transition-opacity hover:opacity-85"
                          onClick={() =>
                            onSelectCategory?.(
                              selectedCategoryId === entry.id ? null : entry.id
                            )
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <CustomDonutTooltip
                          metric={donutMetric}
                          groomName={groomName}
                          brideName={brideName}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-44 w-44 rounded-full border-[18px] border-royal-100" />
                </div>
              )}

              {/* Center 3D Floating Label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className="rounded-full bg-white/95 px-3.5 py-2 shadow-pill border border-royal-100">
                  <span className="block text-base sm:text-lg font-bold tabular-nums text-ink leading-tight">
                    {formatINR(metricTotal)}
                  </span>
                  <span className="block text-[11px] font-medium text-ink-muted">
                    {centerSubtitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Clean Vertical Side Legend */}
            <div className="w-full flex-1 space-y-1.5 max-w-xs max-h-64 overflow-y-auto pr-1">
              {allLegendItems.map((item) => {
                const isSelected = selectedCategoryId === item.id;
                const isZero = item.value === 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onSelectCategory?.(isSelected ? null : item.id)
                    }
                    className={`w-full flex items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-left text-sm transition-all ${
                      isSelected
                        ? 'bg-royal-100 text-royal-900 font-semibold shadow-sm border border-royal-300/70'
                        : 'text-ink hover:bg-royal-50/90'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-3 w-3 shrink-0 rounded-[4px] shadow-sm ${
                          isZero ? 'opacity-45' : ''
                        }`}
                        style={{ backgroundColor: item.color }}
                      />
                      <span
                        className={`truncate text-[13px] ${
                          isZero ? 'text-ink-subtle' : ''
                        }`}
                      >
                        {item.name}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-xs font-medium tabular-nums ${
                        isZero ? 'text-ink-subtle/70' : 'text-ink-subtle'
                      }`}
                    >
                      {item.sharePct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right 3D Card: Spend vs Paid by Category Grouped Bar Chart */}
      <div className="lg:col-span-6 rounded-2xl card-3d p-6 border border-royal-200/90 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-ink">
            Spend vs Paid by Category
          </h2>

          <div className="flex items-center gap-4 text-xs font-medium text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#4C22A8] shadow-sm" />
              Total Cost
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#B88DF6] shadow-sm" />
              Paid
            </span>
          </div>
        </div>

        {barData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-ink-subtle">
            <BarChart3 className="h-9 w-9 mb-2 opacity-40" />
            <p className="text-sm">No categories available yet</p>
          </div>
        ) : (
          <div className={needsHorizontalScroll ? 'overflow-x-auto pb-1' : ''}>
            <div
              className="h-64 flex-1 min-h-[240px] chart-3d-glow"
              style={{
                minWidth: needsHorizontalScroll ? `${barData.length * 64}px` : '100%',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 20 }}
                  barGap={4}
                >
                  <defs>
                    <linearGradient id="barTotal3D" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6D3BD4" />
                      <stop offset="100%" stopColor="#3B1786" />
                    </linearGradient>
                    <linearGradient id="barPaid3D" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D0B2FA" />
                      <stop offset="100%" stopColor="#9A6EE8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#E7E0F6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#4E4666', fontSize: 10.5 }}
                    interval={0}
                    angle={barData.length > 5 ? -28 : 0}
                    textAnchor={barData.length > 5 ? 'end' : 'middle'}
                    dy={barData.length > 5 ? 4 : 0}
                    height={barData.length > 5 ? 54 : 28}
                    axisLine={{ stroke: '#E5DEF6' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatCompactINR}
                    tick={{ fill: '#7B7294', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                  />
                  <Tooltip
                    content={<CustomBarTooltip groomName={groomName} brideName={brideName} />}
                    cursor={{ fill: 'rgba(124, 81, 218, 0.06)' }}
                  />
                  <Bar
                    dataKey="Total Cost"
                    fill="url(#barTotal3D)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="Paid"
                    fill="url(#barPaid3D)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
