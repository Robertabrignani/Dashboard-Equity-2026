'use client';

import { useMemo, useState } from 'react';
import data from '@/data/screening.json';

type WeightKey =
  | 'return1Y'
  | 'return3YAnn'
  | 'return5YAnn'
  | 'sharpe1Y'
  | 'sharpe3Y'
  | 'sharpe5Y'
  | 'vol90D'
  | 'vol360D'
  | 'maxDrawdown3Y'
  | 'maxDrawdown5Y';

type WeightState = Record<WeightKey, number>;

type RankingRow = {
  sqlColumn: string;
  ticker: string;
  shortTicker: string;
  name: string;
  isBenchmark: boolean;
  isSelected: boolean;
  metrics?: Record<string, number | null>;
  quartiles?: Record<string, number | null>;
  ranks?: Record<string, number | null>;
  aggregateScore?: number | null;
  order?: number | null;
};

type RankedRowWithDynamic = RankingRow & {
  dynamicScore: number | null;
  dynamicOrder: number | null;
};

const LABELS: Record<WeightKey, string> = {
  return1Y: '1Y Return',
  return3YAnn: '3Y Return',
  return5YAnn: '5Y Return',
  sharpe1Y: '1Y Sharpe',
  sharpe3Y: '3Y Sharpe',
  sharpe5Y: '5Y Sharpe',
  vol90D: 'Vol 90D',
  vol360D: 'Vol 360D',
  maxDrawdown3Y: '3Y Max Drawdown',
  maxDrawdown5Y: '5Y Max Drawdown',
};

function toPercent(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function normalizeWeights(weights: WeightState): WeightState {
  const total = Object.values(weights).reduce((acc, value) => acc + value, 0);
  if (!total) return weights;

  const normalized = {} as WeightState;
  (Object.keys(weights) as WeightKey[]).forEach((key) => {
    normalized[key] = weights[key] / total;
  });
  return normalized;
}

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${value >= 0 ? '+' : ''}${(value * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function RankingPage() {
  const defaultWeights = data.ranking.defaultWeights as WeightState;

  const [weights, setWeights] = useState<WeightState>(defaultWeights);

  const normalizedWeights = useMemo(() => normalizeWeights(weights), [weights]);

  const rows = useMemo(() => {
    const sourceRows = (data.ranking.rows ?? []) as RankingRow[];

    const recalculated: RankedRowWithDynamic[] = sourceRows.map((row) => {
      if (row.isBenchmark) {
        return { ...row, dynamicScore: null, dynamicOrder: null };
      }

      let dynamicScore = 0;
      (Object.keys(normalizedWeights) as WeightKey[]).forEach((key) => {
        const rank = row.ranks?.[key];
        if (rank != null) {
          dynamicScore += rank * normalizedWeights[key];
        }
      });

      return {
        ...row,
        dynamicScore,
        dynamicOrder: null,
      };
    });

    const ranked = recalculated
      .filter(
        (row): row is RankedRowWithDynamic =>
          !row.isBenchmark && row.dynamicScore !== null && Number.isFinite(row.dynamicScore)
      )
      .sort((a, b) => (a.dynamicScore ?? 999999) - (b.dynamicScore ?? 999999))
      .map((row, index) => ({
        ...row,
        dynamicOrder: index + 1,
      }));

    const benchmarks = recalculated
      .filter((row) => row.isBenchmark)
      .map((row) => ({
        ...row,
        dynamicOrder: null,
      }));

    return [...ranked, ...benchmarks];
  }, [normalizedWeights]);

  function updateWeight(key: WeightKey, rawValue: string) {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return;

    setWeights((current) => ({
      ...current,
      [key]: numeric / 100,
    }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-[#002d72]">Ranking</h1>
        <p className="mt-2 text-sm text-slate-500">
          Ajuste os pesos das métricas e o ranking é recalculado em tempo real.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-slate-200 pb-3">
          <h2 className="text-xl font-bold text-[#002d72]">Pesos</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(normalizedWeights) as WeightKey[]).map((key) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">{LABELS[key]}</div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(weights[key] * 100)}
                onChange={(e) => updateWeight(key, e.target.value)}
                className="w-full"
              />

              <div className="mt-3 flex items-center justify-between">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(weights[key] * 100)}
                  onChange={(e) => updateWeight(key, e.target.value)}
                  className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <span className="text-sm font-semibold text-[#002d72]">
                  Peso efetivo: {toPercent(normalizedWeights[key])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1500px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="sticky left-0 bg-white pb-3 pr-4 font-semibold">Ordem</th>
                <th className="pb-3 pr-4 font-semibold">Fundo</th>
                <th className="pb-3 pr-4 font-semibold">Score</th>
                <th className="pb-3 pr-4 font-semibold">1Y</th>
                <th className="pb-3 pr-4 font-semibold">3Y</th>
                <th className="pb-3 pr-4 font-semibold">5Y</th>
                <th className="pb-3 pr-4 font-semibold">Sharpe 1Y</th>
                <th className="pb-3 pr-4 font-semibold">Sharpe 3Y</th>
                <th className="pb-3 pr-4 font-semibold">Sharpe 5Y</th>
                <th className="pb-3 pr-4 font-semibold">Vol 90D</th>
                <th className="pb-3 pr-4 font-semibold">Vol 360D</th>
                <th className="pb-3 pr-4 font-semibold">DD 3Y</th>
                <th className="pb-3 pr-4 font-semibold">DD 5Y</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowBg = row.isBenchmark
                  ? 'bg-sky-50'
                  : row.isSelected
                    ? 'bg-amber-50'
                    : 'bg-white';

                return (
                  <tr key={row.sqlColumn} className={`border-b border-slate-100 ${rowBg}`}>
                    <td className="sticky left-0 bg-inherit py-3 pr-4 font-semibold text-[#002d72]">
                      {row.dynamicOrder ?? '-'}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-800">{row.name}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {row.dynamicScore == null
                        ? '-'
                        : row.dynamicScore.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </td>
                    <td className="py-3 pr-4">{formatPercent(row.metrics?.return1Y)}</td>
                    <td className="py-3 pr-4">{formatPercent(row.metrics?.return3YAnn)}</td>
                    <td className="py-3 pr-4">{formatPercent(row.metrics?.return5YAnn)}</td>
                    <td className="py-3 pr-4">{formatNumber(row.metrics?.sharpe1Y)}</td>
                    <td className="py-3 pr-4">{formatNumber(row.metrics?.sharpe3Y)}</td>
                    <td className="py-3 pr-4">{formatNumber(row.metrics?.sharpe5Y)}</td>
                    <td className="py-3 pr-4">{formatPercent(row.metrics?.vol90D)}</td>
                    <td className="py-3 pr-4">{formatPercent(row.metrics?.vol360D)}</td>
                    <td className="py-3 pr-4">{formatPercent(row.metrics?.maxDrawdown3Y)}</td>
                    <td className="py-3 pr-4">{formatPercent(row.metrics?.maxDrawdown5Y)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
