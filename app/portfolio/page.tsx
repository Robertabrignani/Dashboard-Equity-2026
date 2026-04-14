import data from '@/data/screening.json';

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

type ChartPoint = {
  date: string;
  portfolioNav: number | null;
  ibovNav: number | null;
  cdiNav: number | null;
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

export default function PortfolioPage() {
  const portfolio = data.portfolio;
  const rawSeries = (portfolio?.series ?? []) as ChartPoint[];
  const weights = portfolio?.weights ?? [];
  const summary = portfolio?.summary ?? {};

  const chartSeries = rawSeries.slice(-252 * 5);

  const portfolioValues = chartSeries.map((item) =>
    item.portfolioNav != null && Number.isFinite(item.portfolioNav) ? item.portfolioNav : null
  );
  const ibovValues = chartSeries.map((item) =>
    item.ibovNav != null && Number.isFinite(item.ibovNav) ? item.ibovNav : null
  );
  const cdiValues = chartSeries.map((item) =>
    item.cdiNav != null && Number.isFinite(item.cdiNav) ? item.cdiNav : null
  );

  const allValidValues = [...portfolioValues, ...ibovValues, ...cdiValues].filter(
    (value): value is number => value != null && Number.isFinite(value)
  );

  const width = 1000;
  const height = 320;

  const globalMin = allValidValues.length ? Math.min(...allValidValues) : 0;
  const globalMax = allValidValues.length ? Math.max(...allValidValues) : 1;

  const portfolioPath = buildPath(portfolioValues, width, height, globalMin, globalMax);
  const ibovPath = buildPath(ibovValues, width, height, globalMin, globalMax);
  const cdiPath = buildPath(cdiValues, width, height, globalMin, globalMax);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-[#002d72]">Portfolio</h1>
        <p className="mt-2 text-sm text-slate-500">
          Portfólio selecionado com pesos, métricas consolidadas e série histórica acumulada.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            1 Ano
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Retorno</span>
              <span className="font-semibold text-emerald-600">{formatPercent(summary.return1YAnn)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sharpe</span>
              <span className="font-semibold text-[#002d72]">
                {(summary.sharpe1Y ?? 0).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Volatilidade</span>
              <span className="font-semibold text-slate-700">{formatPercent(summary.vol1Y)}</span>
            </div>
            <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
              IBOV: {formatPercent(summary.ibov1YAnn)} | CDI: {formatPercent(summary.cdi1YAnn)}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            3 Anos
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Retorno</span>
              <span className="font-semibold text-emerald-600">{formatPercent(summary.return3YAnn)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sharpe</span>
              <span className="font-semibold text-[#002d72]">
                {(summary.sharpe3Y ?? 0).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Volatilidade</span>
              <span className="font-semibold text-slate-700">{formatPercent(summary.vol3Y)}</span>
            </div>
            <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
              IBOV: {formatPercent(summary.ibov3YAnn)} | CDI: {formatPercent(summary.cdi3YAnn)}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            5 Anos
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Retorno</span>
              <span className="font-semibold text-emerald-600">{formatPercent(summary.return5YAnn)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sharpe</span>
              <span className="font-semibold text-[#002d72]">
                {(summary.sharpe5Y ?? 0).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Volatilidade</span>
              <span className="font-semibold text-slate-700">{formatPercent(summary.vol5Y)}</span>
            </div>
            <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
              IBOV: {formatPercent(summary.ibov5YAnn)} | CDI: {formatPercent(summary.cdi5YAnn)}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-slate-200 pb-3 text-xl font-bold text-[#002d72]">
            Pesos do Portfólio
          </div>

          <div className="space-y-3">
            {weights.map((item) => (
              <div
                key={item.sqlColumn}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-800">{item.name}</span>
                <span className="text-sm font-semibold text-[#002d72]">{formatWeight(item.weight)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-slate-200 pb-3 text-xl font-bold text-[#002d72]">
            Cota Acumulada — Portfolio vs IBOV vs CDI
          </div>

          {allValidValues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
              Não há dados suficientes para desenhar o gráfico.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-[360px] w-full min-w-[900px] rounded-2xl bg-slate-50"
              >
                <path d={portfolioPath} fill="none" stroke="#002d72" strokeWidth="3" />
                <path d={ibovPath} fill="none" stroke="#0284c7" strokeWidth="2.5" />
                <path d={cdiPath} fill="none" stroke="#16a34a" strokeWidth="2.5" />
              </svg>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#002d72]" />
              <span>Portfolio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-600" />
              <span>IBOV</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-600" />
              <span>CDI</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
