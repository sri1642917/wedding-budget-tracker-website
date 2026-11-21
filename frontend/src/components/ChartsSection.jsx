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

function CustomDonutTooltip({ active, payload, metric }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const metricLabel =
    metric === 'actual' ? 'Actual Spend' : metric === 'estimated' ? 'Estimated' : 'Budget Cap';

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
      </div>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }) {
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
        {row.Paid !== undefined && (
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-royal-100">
            <span className="text-emerald-700 font-medium">Paid So Far</span>
            <span className="font-semibold text-emerald-700">{formatINR(row.Paid)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChartsSection({
  categoryStats,
  totalActual,
  totalEstimated,
  selectedCategoryId,
  onSelectCategory,
}) {
  const [donutMetric, setDonutMetric] = useState('actual');

  const totalBudgetCaps = categoryStats.reduce(
    (sum, c) => sum + Number(c.budgetCap || 0),
    0
  );

  const metricTotal =
    donutMetric === 'actual'
      ? totalActual
      : donutMetric === 'estimated'
        ? totalEstimated
        : totalBudgetCaps;

  const allLegendItems = categoryStats
    .map((c, idx) => {
      const value =
        donutMetric === 'actual'
          ? c.actual
          : donutMetric === 'estimated'
            ? c.estimated
            : Number(c.budgetCap || 0);
      return {
        id: c.id,
        name: c.name,
        color: c.color || DONUT_SHADES[idx % DONUT_SHADES.length],
        value,
        paid: c.paid,
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
      Estimated: c.estimated,
      Actual: c.actual,
      Paid: c.paid,
    };
  });

  const centerSubtitle =
    donutMetric === 'actual'
      ? 'Spent'
      : donutMetric === 'estimated'
        ? 'Estimated'
        : 'Allocated';

  const needsHorizontalScroll = barData.length > 10;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Card: Expense Breakdown (Donut + Clean Side Legend) */}
      <div className="lg:col-span-6 rounded-2xl bg-white/95 p-6 shadow-card border border-royal-200/85 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-ink">
            Expense Breakdown
          </h2>

          <div className="inline-flex rounded-lg bg-royal-50 p-0.5 border border-royal-200/80 text-xs font-medium">
            {[
              { key: 'actual', label: 'Actual' },
              { key: 'estimated', label: 'Estimated' },
              { key: 'budget', label: 'Budget' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDonutMetric(tab.key)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  donutMetric === tab.key
                    ? 'bg-royal-800 text-white shadow-sm'
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
            {/* Donut Chart */}
            <div className="relative h-56 w-56 shrink-0">
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
                      paddingAngle={1.5}
                      stroke="#FFFFFF"
                      strokeWidth={2}
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
                    <Tooltip content={<CustomDonutTooltip metric={donutMetric} />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-44 w-44 rounded-full border-[18px] border-royal-100" />
                </div>
              )}

              {/* Center Amount Label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="text-lg font-bold tabular-nums text-ink leading-tight">
                  {formatINR(metricTotal)}
                </span>
                <span className="text-xs font-medium text-ink-muted mt-0.5">
                  {centerSubtitle}
                </span>
              </div>
            </div>

            {/* Clean Vertical Side Legend — reflects ALL categories dynamically */}
            <div className="w-full flex-1 space-y-1.5 max-w-xs max-h-60 overflow-y-auto pr-1">
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
                    className={`w-full flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-royal-100/90 text-royal-900 font-semibold'
                        : 'text-ink hover:bg-royal-50/80'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-3 w-3 shrink-0 rounded-[4px] ${
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

      {/* Right Card: Estimated vs Actual Spend Grouped Bar Chart */}
      <div className="lg:col-span-6 rounded-2xl bg-white/95 p-6 shadow-card border border-royal-200/85 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-ink">
            Estimated vs Actual Spend
          </h2>

          <div className="flex items-center gap-4 text-xs font-medium text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#4C22A8]" />
              Estimated
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#B88DF6]" />
              Actual
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
              className="h-64 flex-1 min-h-[240px]"
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
                    content={<CustomBarTooltip />}
                    cursor={{ fill: 'rgba(124, 81, 218, 0.06)' }}
                  />
                  <Bar
                    dataKey="Estimated"
                    fill="#4C22A8"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="Actual"
                    fill="#B88DF6"
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
