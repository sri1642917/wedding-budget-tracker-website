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

export default function KpiCards({ stats }) {
  const { totalEstimated, totalActual, totalPaid, totalBalance, pendingCount, expenseCount } = stats;

  const estDelta = totalEstimated - totalActual;
  const isOverEst = totalEstimated > 0 && estDelta < 0;
  const paidPct = totalActual > 0 ? Math.min(100, Math.round((totalPaid / totalActual) * 100)) : 0;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Estimated */}
      <div className="flex flex-col justify-between rounded-2xl bg-white/95 px-5 py-4 shadow-card border-[1.5px] border-royal-700/75 hover:border-royal-800 hover:shadow-card-hover transition-all">
        <p className="text-[1.45rem] xl:text-[1.6rem] font-bold tracking-tight tabular-nums text-ink leading-snug">
          {formatINR(totalEstimated)}
        </p>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-ink-muted">Total Estimated</p>
            <p className="text-[10px] text-ink-subtle mt-0.5">
              {expenseCount} {expenseCount === 1 ? 'vendor item' : 'vendor items'}
            </p>
          </div>
          <MiniSparkline
            id="estimated"
            points="2,24 12,23 22,14 30,20 40,8 49,21 62,10"
            stroke="#6D3BD4"
          />
        </div>
      </div>

      {/* 2. Actual Spend */}
      <div className="flex flex-col justify-between rounded-2xl bg-white/95 px-5 py-4 shadow-card border border-royal-200/85 hover:border-royal-300 transition-all">
        <p className="text-[1.45rem] xl:text-[1.6rem] font-bold tracking-tight tabular-nums text-ink leading-snug">
          {formatINR(totalActual)}
        </p>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-ink-muted">Actual Spend</p>
            <p
              className={`text-[10px] mt-0.5 font-medium ${
                isOverEst ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {totalEstimated === 0
                ? 'Final vendor total'
                : isOverEst
                  ? `${formatINR(Math.abs(estDelta))} over est.`
                  : `${formatINR(estDelta)} under est.`}
            </p>
          </div>
          <MiniSparkline
            id="actual"
            points="2,25 14,22 25,19 34,21 44,15 52,18 62,8"
            stroke="#7546D6"
          />
        </div>
      </div>

      {/* 3. Paid So Far */}
      <div className="flex flex-col justify-between rounded-2xl bg-white/95 px-5 py-4 shadow-card border border-royal-200/85 hover:border-royal-300 transition-all">
        <p className="text-[1.45rem] xl:text-[1.6rem] font-bold tracking-tight tabular-nums text-ink leading-snug">
          {formatINR(totalPaid)}
        </p>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-ink-muted">Paid So Far</p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
              {paidPct}% settled
            </p>
          </div>
          <MiniSparkline
            id="paid"
            points="2,24 12,18 22,22 33,13 43,19 52,15 62,9"
            stroke="#8E5EE3"
          />
        </div>
      </div>

      {/* 4. Balance Due */}
      <div className="flex flex-col justify-between rounded-2xl bg-white/95 px-5 py-4 shadow-card border border-royal-200/85 hover:border-royal-300 transition-all">
        <p className="text-[1.45rem] xl:text-[1.6rem] font-bold tracking-tight tabular-nums text-ink leading-snug">
          {formatINR(totalBalance)}
        </p>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-ink-muted">Balance Due</p>
            <p className="text-[10px] text-ink-subtle mt-0.5">
              {pendingCount === 0
                ? 'All items settled'
                : `${pendingCount} ${pendingCount === 1 ? 'item' : 'items'} pending`}
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
