'use client';

import Image from 'next/image';
import data from '@/data/screening.json';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type PortfolioSeriesRow = {
  date: string;
  portfolioNav: number | null;
  portfolioDrawdown: number | null;
  portfolioDailyReturn: number | null;
  ibovNav: number | null;
  cdiNav: number | null;
};

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${value >= 0 ? '+' : ''}${(value * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatPercentNoSign(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${(value * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatWeight(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleDateString('pt-BR');
}

function formatDateTime(dateValue: string | null | undefined) {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleString('pt-BR');
}

function formatMonthYear(dateValue: string | null | undefined) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  return date.toLocaleDateString('pt-BR', {
    month: 'short',
    year: '2-digit',
  });
}

function calculateDrawdownFromNav(values: Array<number | null>) {
  const result: Array<number | null> = [];
  let runningMax: number | null = null;

  for (const value of values) {
    if (value == null || !Number.isFinite(value)) {
      result.push(null);
      continue;
    }

    if (runningMax == null || value > runningMax) {
      runningMax = value;
    }

    result.push(runningMax > 0 ? value / runningMax - 1 : 0);
  }

  return result;
}

function getMinValid(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value != null && Number.isFinite(value));
  return valid.length ? Math.min(...valid) : null;
}

function diffClass(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 'text-slate-500';
  return value >= 0 ? 'text-emerald-600' : 'text-rose-600';
}

function CustomTooltip({
  active,
  payload,
  label,
  isPercent = false,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  isPercent?: boolean;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-[#BFBFBF] bg-white px-4 py-3 shadow-lg">
      <div className="mb-2 text-sm font-semibold text-[#003C4C]">
        {formatDate(label)}
      </div>
      <div className="space-y-1 text-sm">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#52768D]">{entry.name}:</span>
            <span className="font-semibold text-[#003C4C]">
              {isPercent
                ? formatPercentNoSign(entry.value)
                : Number(entry.value).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioHomePage() {
  const portfolio = data.portfolio;
  const summary = portfolio?.summary ?? {};
  const weights = portfolio?.weights ?? [];
  const rawSeries = (portfolio?.series ?? []) as PortfolioSeriesRow[];

  const chartSeries = rawSeries.slice(-252 * 5);

  const portfolioNavValues = chartSeries.map((item) =>
    item.portfolioNav != null && Number.isFinite(item.portfolioNav) ? item.portfolioNav : null
  );
  const ibovNavValues = chartSeries.map((item) =>
    item.ibovNav != null && Number.isFinite(item.ibovNav) ? item.ibovNav : null
  );
  const cdiNavValues = chartSeries.map((item) =>
    item.cdiNav != null && Number.isFinite(item.cdiNav) ? item.cdiNav : null
  );

  const portfolioDrawdownValues = calculateDrawdownFromNav(portfolioNavValues);
  const ibovDrawdownValues = calculateDrawdownFromNav(ibovNavValues);

  const chartData = chartSeries.map((item, index) => ({
    date: item.date,
    portfolioNav: item.portfolioNav,
    ibovNav: item.ibovNav,
    cdiNav: item.cdiNav,
    portfolioDrawdown: portfolioDrawdownValues[index],
    ibovDrawdown: ibovDrawdownValues[index],
  }));

  const excessVsIbov1Y =
    summary.return1YAnn != null && summary.ibov1YAnn != null
      ? summary.return1YAnn - summary.ibov1YAnn
      : null;
  const excessVsIbov3Y =
    summary.return3YAnn != null && summary.ibov3YAnn != null
      ? summary.return3YAnn - summary.ibov3YAnn
      : null;
  const excessVsIbov5Y =
    summary.return5YAnn != null && summary.ibov5YAnn != null
      ? summary.return5YAnn - summary.ibov5YAnn
      : null;

  const excessVsCdi1Y =
    summary.return1YAnn != null && summary.cdi1YAnn != null
      ? summary.return1YAnn - summary.cdi1YAnn
      : null;
  const excessVsCdi3Y =
    summary.return3YAnn != null && summary.cdi3YAnn != null
      ? summary.return3YAnn - summary.cdi3YAnn
      : null;
  const excessVsCdi5Y =
    summary.return5YAnn != null && summary.cdi5YAnn != null
      ? summary.return5YAnn - summary.cdi5YAnn
      : null;

  const maxDdPortfolio = getMinValid(portfolioDrawdownValues);
  const maxDdIbov = getMinValid(ibovDrawdownValues);

  return (
    <div className="min-h-screen bg-[#D9D9D9] -mx-6 -mt-8 px-6 py-8">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-5">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-[#D9D9D9] bg-[#F7F8FA]">
                <Image
                  src="/logo-rdp.png"
                  alt="Rio das Pedras Investimentos"
                  fill
                  className="object-contain p-2"
                  priority
                />
              </div>

              <div>
                <div className="mb-3 inline-flex rounded-full bg-[#A6BBCA] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#003C4C]">
                  Portfolio principal
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-[#003C4C]">
                  Portfolio RDP TOTAL RETURN
                </h1>

                <div className="mt-4 space-y-1 text-sm text-[#52768D]">
                  <p>
                    Data de referência dos dados:{' '}
                    <span className="font-semibold text-[#003C4C]">
                      {formatDate(data.updatedAt)}
                    </span>
                  </p>
                  <p>
                    Último update do site:{' '}
                    <span className="font-semibold text-[#003C4C]">
                      {formatDateTime((data as { generatedAt?: string | null }).generatedAt)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#BFBFBF] bg-[#F7F8FA] px-5 py-4 text-sm text-[#52768D]">
              Fonte:{' '}
              <span className="font-semibold text-[#003C4C]">
                Tbl_VariableData_BloombergMatrix
              </span>
            </div>
          </div>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[0.72fr,1.28fr]">
          <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-5 shadow-sm">
            <div className="mb-4 border-b border-[#D9D9D9] pb-3">
              <h2 className="text-xl font-bold text-[#003C4C]">Divisão do Portfolio</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D9D9D9] text-left text-[#52768D]">
                    <th className="pb-3 pr-4 font-semibold">Fundo</th>
                    <th className="pb-3 pr-4 text-right font-semibold">Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {weights.map((item) => (
                    <tr key={item.sqlColumn} className="border-b border-[#F1F1F1]">
                      <td className="py-2.5 pr-4 font-medium text-[#003C4C]">{item.name}</td>
                      <td className="py-2.5 pr-4 text-right font-semibold text-[#52768D]">
                        {formatWeight(item.weight)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-5 shadow-sm">
            <div className="mb-4 border-b border-[#D9D9D9] pb-3">
              <h2 className="text-xl font-bold text-[#003C4C]">Resumo de Performance</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D9D9D9] text-left text-[#52768D]">
                    <th className="pb-3 pr-4 font-semibold">Métrica</th>
                    <th className="pb-3 pr-4 font-semibold">1 Ano</th>
                    <th className="pb-3 pr-4 font-semibold">3 Anos</th>
                    <th className="pb-3 pr-4 font-semibold">5 Anos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#F1F1F1]">
                    <td className="py-3 pr-4 font-semibold text-[#003C4C]">Retorno</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.return1YAnn)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.return3YAnn)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.return5YAnn)}</td>
                  </tr>
                  <tr className="border-b border-[#F1F1F1]">
                    <td className="py-3 pr-4 font-semibold text-[#003C4C]">Sharpe</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatNumber(summary.sharpe1Y)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatNumber(summary.sharpe3Y)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatNumber(summary.sharpe5Y)}</td>
                  </tr>
                  <tr className="border-b border-[#D9D9D9]">
                    <td className="py-3 pr-4 font-semibold text-[#003C4C]">Volatilidade</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.vol1Y)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.vol3Y)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.vol5Y)}</td>
                  </tr>

                  <tr className="border-b border-[#F1F1F1] bg-[#F7F8FA]">
                    <td className="py-3 pr-4 font-semibold text-[#52768D]">Excesso vs IBOV</td>
                    <td className={`py-3 pr-4 font-semibold ${diffClass(excessVsIbov1Y)}`}>
                      {formatPercent(excessVsIbov1Y)}
                    </td>
                    <td className={`py-3 pr-4 font-semibold ${diffClass(excessVsIbov3Y)}`}>
                      {formatPercent(excessVsIbov3Y)}
                    </td>
                    <td className={`py-3 pr-4 font-semibold ${diffClass(excessVsIbov5Y)}`}>
                      {formatPercent(excessVsIbov5Y)}
                    </td>
                  </tr>
                  <tr className="bg-[#F7F8FA]">
                    <td className="py-3 pr-4 font-semibold text-[#52768D]">Excesso vs CDI</td>
                    <td className={`py-3 pr-4 font-semibold ${diffClass(excessVsCdi1Y)}`}>
                      {formatPercent(excessVsCdi1Y)}
                    </td>
                    <td className={`py-3 pr-4 font-semibold ${diffClass(excessVsCdi3Y)}`}>
                      {formatPercent(excessVsCdi3Y)}
                    </td>
                    <td className={`py-3 pr-4 font-semibold ${diffClass(excessVsCdi5Y)}`}>
                      {formatPercent(excessVsCdi5Y)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="mb-5 border-b border-[#D9D9D9] pb-4">
            <h2 className="text-2xl font-bold text-[#003C4C]">Portfolio x CDI x IBOV</h2>
            <p className="mt-2 text-sm text-[#808080]">Eixo: cota x data</p>
          </div>

          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid stroke="#D9D9D9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatMonthYear}
                  minTickGap={40}
                  stroke="#808080"
                />
                <YAxis stroke="#808080" tickFormatter={(value) => formatNumber(value, 0)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="portfolioNav"
                  name="Portfolio"
                  stroke="#003C4C"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cdiNav"
                  name="CDI"
                  stroke="#52768D"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ibovNav"
                  name="Ibovespa"
                  stroke="#A6BBCA"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="mb-5 border-b border-[#D9D9D9] pb-4">
            <h2 className="text-2xl font-bold text-[#003C4C]">Drawdown Máximo — IBOV x Portfolio</h2>
            <p className="mt-2 text-sm text-[#808080]">
              Drawdown diário = (cota atual / pico histórico) - 1
            </p>
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#D9D9D9] bg-[#F7F8FA] p-4">
              <div className="text-sm font-semibold text-[#52768D]">Máximo Drawdown Portfolio</div>
              <div className="mt-2 text-3xl font-bold text-[#003C4C]">
                {formatPercentNoSign(maxDdPortfolio)}
              </div>
            </div>
            <div className="rounded-2xl border border-[#D9D9D9] bg-[#F7F8FA] p-4">
              <div className="text-sm font-semibold text-[#52768D]">Máximo Drawdown IBOV</div>
              <div className="mt-2 text-3xl font-bold text-[#003C4C]">
                {formatPercentNoSign(maxDdIbov)}
              </div>
            </div>
          </div>

          <div className="h-[390px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid stroke="#D9D9D9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatMonthYear}
                  minTickGap={40}
                  stroke="#808080"
                />
                <YAxis
                  stroke="#808080"
                  tickFormatter={(value) =>
                    `${Number(value * 100).toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}%`
                  }
                />
                <Tooltip content={<CustomTooltip isPercent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="portfolioDrawdown"
                  name="Portfolio"
                  stroke="#003C4C"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ibovDrawdown"
                  name="Ibovespa"
                  stroke="#A6BBCA"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
