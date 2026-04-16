import Image from 'next/image';
import data from '@/data/screening.json';

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

  const allNavValues = [...portfolioNavValues, ...ibovNavValues, ...cdiNavValues].filter(
    (value): value is number => value != null && Number.isFinite(value)
  );

  const allDrawdownValues = [...portfolioDrawdownValues, ...ibovDrawdownValues].filter(
    (value): value is number => value != null && Number.isFinite(value)
  );

  const navWidth = 1100;
  const navHeight = 360;
  const ddWidth = 1100;
  const ddHeight = 320;

  const navMin = allNavValues.length ? Math.min(...allNavValues) : 0;
  const navMax = allNavValues.length ? Math.max(...allNavValues) : 1;

  const ddMin = allDrawdownValues.length ? Math.min(...allDrawdownValues) : -0.3;
  const ddMax = 0;

  const portfolioNavPath = buildPath(portfolioNavValues, navWidth, navHeight, navMin, navMax);
  const ibovNavPath = buildPath(ibovNavValues, navWidth, navHeight, navMin, navMax);
  const cdiNavPath = buildPath(cdiNavValues, navWidth, navHeight, navMin, navMax);

  const portfolioDdPath = buildPath(portfolioDrawdownValues, ddWidth, ddHeight, ddMin, ddMax);
  const ibovDdPath = buildPath(ibovDrawdownValues, ddWidth, ddHeight, ddMin, ddMax);

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

        <section className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
          <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
            <div className="mb-5 border-b border-[#D9D9D9] pb-4">
              <h2 className="text-2xl font-bold text-[#003C4C]">Divisão do Portfolio</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D9D9D9] text-left text-[#52768D]">
                    <th className="pb-3 pr-4 font-semibold">Fundo</th>
                    <th className="pb-3 pr-4 font-semibold text-right">Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {weights.map((item) => (
                    <tr key={item.sqlColumn} className="border-b border-[#F1F1F1]">
                      <td className="py-3 pr-4 font-medium text-[#003C4C]">{item.name}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-[#52768D]">
                        {formatWeight(item.weight)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
            <div className="mb-5 border-b border-[#D9D9D9] pb-4">
              <h2 className="text-2xl font-bold text-[#003C4C]">Resumo de Performance</h2>
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
                    <td className="py-3 pr-4 font-semibold text-[#003C4C]">Portfolio — Retorno</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.return1YAnn)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.return3YAnn)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.return5YAnn)}</td>
                  </tr>
                  <tr className="border-b border-[#F1F1F1]">
                    <td className="py-3 pr-4 font-semibold text-[#003C4C]">Portfolio — Sharpe</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatNumber(summary.sharpe1Y)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatNumber(summary.sharpe3Y)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatNumber(summary.sharpe5Y)}</td>
                  </tr>
                  <tr className="border-b border-[#D9D9D9]">
                    <td className="py-3 pr-4 font-semibold text-[#003C4C]">Portfolio — Volatilidade</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.vol1Y)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.vol3Y)}</td>
                    <td className="py-3 pr-4 text-[#003C4C]">{formatPercent(summary.vol5Y)}</td>
                  </tr>

                  <tr className="border-b border-[#F1F1F1] bg-[#F7F8FA]">
                    <td className="py-3 pr-4 font-semibold text-[#52768D]">IBOV</td>
                    <td className="py-3 pr-4 text-[#52768D]">{formatPercent(summary.ibov1YAnn)}</td>
                    <td className="py-3 pr-4 text-[#52768D]">{formatPercent(summary.ibov3YAnn)}</td>
                    <td className="py-3 pr-4 text-[#52768D]">{formatPercent(summary.ibov5YAnn)}</td>
                  </tr>
                  <tr className="border-b border-[#F1F1F1] bg-[#F7F8FA]">
                    <td className="py-3 pr-4 font-semibold text-[#52768D]">CDI</td>
                    <td className="py-3 pr-4 text-[#52768D]">{formatPercent(summary.cdi1YAnn)}</td>
                    <td className="py-3 pr-4 text-[#52768D]">{formatPercent(summary.cdi3YAnn)}</td>
                    <td className="py-3 pr-4 text-[#52768D]">{formatPercent(summary.cdi5YAnn)}</td>
                  </tr>

                  <tr className="border-b border-[#F1F1F1]">
                    <td className="py-3 pr-4 font-semibold text-[#003C4C]">Excesso vs IBOV</td>
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
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-[#003C4C]">Excesso vs CDI</td>
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
            <p className="mt-2 text-sm text-[#808080]">Eixo: cota acumulada x data</p>
          </div>

          {allNavValues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#BFBFBF] bg-[#F7F8FA] p-10 text-center text-sm text-[#808080]">
              Não há dados suficientes para desenhar o gráfico.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${navWidth} ${navHeight}`}
                className="h-[380px] w-full min-w-[950px] rounded-2xl bg-[#F7F8FA]"
              >
                <path d={portfolioNavPath} fill="none" stroke="#003C4C" strokeWidth="3" />
                <path d={cdiNavPath} fill="none" stroke="#52768D" strokeWidth="2.5" />
                <path d={ibovNavPath} fill="none" stroke="#A6BBCA" strokeWidth="2.5" />
              </svg>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#52768D]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#003C4C]" />
              <span>Portfolio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#52768D]" />
              <span>CDI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#A6BBCA]" />
              <span>IBOV</span>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="mb-5 border-b border-[#D9D9D9] pb-4">
            <h2 className="text-2xl font-bold text-[#003C4C]">Drawdown Máximo — Portfolio x IBOV</h2>
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

          {allDrawdownValues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#BFBFBF] bg-[#F7F8FA] p-10 text-center text-sm text-[#808080]">
              Não há dados suficientes para desenhar o gráfico.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${ddWidth} ${ddHeight}`}
                className="h-[340px] w-full min-w-[950px] rounded-2xl bg-[#F7F8FA]"
              >
                <path d={portfolioDdPath} fill="none" stroke="#003C4C" strokeWidth="3" />
                <path d={ibovDdPath} fill="none" stroke="#A6BBCA" strokeWidth="2.5" />
              </svg>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#52768D]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#003C4C]" />
              <span>Portfolio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#A6BBCA]" />
              <span>IBOV</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}