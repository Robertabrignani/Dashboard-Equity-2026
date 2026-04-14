'use client';

import { useMemo, useState } from 'react';
import data from '@/data/screening.json';

type BacktestMode = 'hrp' | 'mpt';

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${value >= 0 ? '+' : ''}${(value * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatWeight(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type BacktestSeriesRow = {
  date: string;
  nav: number | null;
  drawdown: number | null;
  dailyReturn: number | null;
};

function buildPath(
  values: Array<number | null>,
  width: number,
  height: number,
  globalMin: number,
  globalMax: number
) {
  const validPoints = values
    .map((value, index) => ({ value, index }))
    .filter((point) => point.value != null && Number.isFinite(point.value));

  if (!validPoints.length) return '';

  const range = globalMax - globalMin || 1;

  return validPoints
    .map((point, pathIndex) => {
      const x = (point.index / Math.max(values.length - 1, 1)) * width;
      const y = height - (((point.value as number) - globalMin) / range) * height;
      return `${pathIndex === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function heatmapClass(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 'bg-slate-100 text-slate-500';
  if (value >= 0.8) return 'bg-emerald-700 text-white';
  if (value >= 0.6) return 'bg-emerald-500 text-white';
  if (value >= 0.4) return 'bg-emerald-300 text-emerald-950';
  if (value >= 0.2) return 'bg-lime-200 text-lime-950';
  if (value >= 0) return 'bg-slate-100 text-slate-800';
  if (value >= -0.2) return 'bg-amber-100 text-amber-900';
  if (value >= -0.4) return 'bg-orange-200 text-orange-950';
  if (value >= -0.6) return 'bg-rose-300 text-rose-950';
  return 'bg-rose-600 text-white';
}

export default function BacktestPage() {
  const [mode, setMode] = useState<BacktestMode>('hrp');

  const backtestData = useMemo(() => {
    return mode === 'hrp' ? data.backtest?.hrp : data.backtest?.mpt;
  }, [mode]);

  const weights = backtestData?.weights ?? [];
  const summary = backtestData?.summary ?? {};
  const series = (backtestData?.series ?? []) as BacktestSeriesRow[];

  const correlation = data.backtest?.correlation ?? {
    labels: [],
    matrix: [],
    linkage: [],
  };

  const chartSeries = series.slice(-252 * 5);
  const navValues = chartSeries.map((item) =>
    item.nav != null && Number.isFinite(item.nav) ? item.nav : null
  );

  const allValidValues = navValues.filter(
    (value): value is number => value != null && Number.isFinite(value)
  );

  const width = 1100;
  const height = 340;

  const globalMin = allValidValues.length ? Math.min(...allValidValues) : 0;
  const globalMax = allValidValues.length ? Math.max(...allValidValues) : 1;

  const navPath = buildPath(navValues, width, height, globalMin, globalMax);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#002d72]">Backtest</h1>
            <p className="mt-2 text-sm text-slate-500">
              Backtest histórico com dois métodos de alocação: HRP e MPT.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <button
              type="button"
              onClick={() => setMode('hrp')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                mode === 'hrp'
                  ? 'bg-[#002d72] text-white'
                  : 'bg-white text-slate-700'
              }`}
            >
              HRP
            </button>
            <button
              type="button"
              onClick={() => setMode('mpt')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                mode === 'mpt'
                  ? 'bg-[#002d72] text-white'
                  : 'bg-white text-slate-700'
              }`}
            >
              MPT
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Retorno anualizado 5Y
          </div>
          <div className="mt-3 text-4xl font-bold text-emerald-600">
            {formatPercent(summary.return5YAnn)}
          </div>
          <div className="mt-2 text-sm text-slate-500">Baseado na série histórica do método</div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Volatilidade 5Y
          </div>
          <div className="mt-3 text-4xl font-bold text-[#002d72]">
            {formatPercent(summary.vol5Y)}
          </div>
          <div className="mt-2 text-sm text-slate-500">Desvio padrão anualizado</div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Máx drawdown 5Y
          </div>
          <div className="mt-3 text-4xl font-bold text-rose-600">
            {formatPercent(summary.maxDrawdown5Y)}
          </div>
          <div className="mt-2 text-sm text-slate-500">Pior drawdown observado</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-slate-200 pb-3 text-xl font-bold text-[#002d72]">
            Pesos — {mode.toUpperCase()}
          </div>

          <div className="space-y-3">
            {weights.map((item) => (
              <div
                key={item.sqlColumn}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-800">{item.name}</span>
                <span className="text-sm font-semibold text-[#002d72]">
                  {formatWeight(item.weight)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-slate-200 pb-3 text-xl font-bold text-[#002d72]">
            Performance histórica do backtest — {mode.toUpperCase()}
          </div>

          {allValidValues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
              Não há dados suficientes para desenhar o gráfico.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-[380px] w-full min-w-[950px] rounded-2xl bg-slate-50"
              >
                <path d={navPath} fill="none" stroke="#002d72" strokeWidth="3" />
              </svg>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-[#002d72]" />
            <span>Backtest {mode.toUpperCase()}</span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-slate-200 pb-3 text-xl font-bold text-[#002d72]">
          Matriz de correlação
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1000px] border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white p-2 text-left font-semibold text-slate-500">
                  Fundo
                </th>
                {correlation.labels.map((label: string) => (
                  <th
                    key={label}
                    className="min-w-[90px] p-2 text-center font-semibold text-slate-500"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlation.matrix.map((row: Array<number | null>, rowIndex: number) => (
                <tr key={correlation.labels[rowIndex] ?? rowIndex}>
                  <td className="sticky left-0 bg-white p-2 font-semibold text-slate-700">
                    {correlation.labels[rowIndex]}
                  </td>
                  {row.map((value, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className={`rounded-lg p-2 text-center font-semibold ${heatmapClass(value)}`}
                    >
                      {value == null
                        ? '-'
                        : value.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-slate-200 pb-3 text-xl font-bold text-[#002d72]">
          Estrutura do dendrograma
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Left</th>
                <th className="pb-3 pr-4 font-semibold">Right</th>
                <th className="pb-3 pr-4 font-semibold">Distance</th>
                <th className="pb-3 pr-4 font-semibold">Size</th>
              </tr>
            </thead>
            <tbody>
              {correlation.linkage.map(
                (
                  item: { left: number; right: number; distance: number; size: number },
                  index: number
                ) => (
                  <tr key={`${item.left}-${item.right}-${index}`} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-700">{item.left}</td>
                    <td className="py-3 pr-4 text-slate-700">{item.right}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {item.distance.toLocaleString('pt-BR', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{item.size}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Essa tabela traz a estrutura de linkage usada para o dendrograma.
        </p>
      </section>
    </div>
  );
}
