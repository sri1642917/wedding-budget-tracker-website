import React from 'react';
import { formatINR } from '../utils/format';

function MiniSparkline({ id, points, stroke = '#7C51DA' }) {
  const areaPoints = `0,28 ${points} 64,28`;
  return (
    <svg
      viewBox="0 0 64 28"
      className="h-7 w-16 shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${id})`} />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function KpiCards({ stats, categoryCount = 0 }) {
  const {
    totalActual,
    totalPaid,
    totalBalance,
    harshaPaid = 0,
    divyaPaid = 0,
    sharedPaid = 0,
    pendingCount,
    expenseCount,
  } = stats;
  const paidPct = totalActual > 0 ? Math.min(100, Math.round((totalPaid / totalActual) * 100)) : 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Total Spend */}
      <div className="flex flex-col justify-between rounded-2xl bg-white/95 px-5 py-4 shadow-card border-[1.5px] border-royal-700/75 hover:border-royal-800 hover:shadow-card-hover transition-all">
        <p className="text-[1.55rem] xl:text-[1.75rem] font-bold tracking-tight tabular-nums text-ink leading-snug">
          {formatINR(totalActual)}
        </p>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-ink-muted">Total Spend</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">
              {expenseCount} {expenseCount === 1 ? 'item' : 'items'} across {categoryCount}{' '}
              {categoryCount === 1 ? 'category' : 'categories'}
            </p>
          </div>
          <MiniSparkline
            id="spend"
            points="2,24 12,23 22,14 30,20 40,8 49,21 62,10"
            stroke="#6D3BD4"
          />
        </div>
      </div>

      {/* 2. Paid So Far */}
      <div className="flex flex-col justify-between rounded-2xl bg-white/95 px-5 py-4 shadow-card border border-royal-200/85 hover:border-royal-300 transition-all">
        <p className="text-[1.55rem] xl:text-[1.75rem] font-bold tracking-tight tabular-nums text-ink leading-snug">
          {formatINR(totalPaid)}
        </p>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-ink-muted">Paid So Far</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
              {paidPct}% settled • Harsha {formatINR(harshaPaid)} · Divya {formatINR(divyaPaid)}
            </p>
          </div>
          <MiniSparkline
            id="paid"
            points="2,24 12,18 22,22 33,13 43,19 52,15 62,9"
            stroke="#7C51DA"
          />
        </div>
      </div>

      {/* 3. Balance Due */}
      <div className="flex flex-col justify-between rounded-2xl bg-white/95 px-5 py-4 shadow-card border border-royal-200/85 hover:border-royal-300 transition-all">
        <p className="text-[1.55rem] xl:text-[1.75rem] font-bold tracking-tight tabular-nums text-ink leading-snug">
          {formatINR(totalBalance)}
        </p>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-ink-muted">Balance Due</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">
              {pendingCount === 0
                ? 'All payments settled'
                : `${pendingCount} ${pendingCount === 1 ? 'item' : 'items'} pending balance`}
            </p>
          </div>
          <MiniSparkline
            id="balance"
            points="2,24 13,22 23,23 33,12 42,22 52,19 62,11"
            stroke="#9B75E8"
          />
        </div>
      </div>
    </section>
  );
}
