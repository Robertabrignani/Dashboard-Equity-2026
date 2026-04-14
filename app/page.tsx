import Link from 'next/link';
import data from '@/data/screening.json';

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${value >= 0 ? '+' : ''}${(value * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleDateString('pt-BR');
}

function formatWeight(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function HomePage() {
  const topRanked = [...(data.ranking?.rows ?? [])]
    .filter((row) => !row.isBenchmark && row.order != null)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .slice(0, 5);

  const selectedWeights = data.portfolio?.weights ?? [];
  const portfolioSummary = data.portfolio?.summary ?? {};
  const metricCount = data.metrics?.length ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
              Dados calculados a partir da base
            </div>
            <h1 className="text-3xl font-bold text-[#002d72]">
              Equity Dashboard — Screening de FIAs
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Última atualização:{' '}
              <span className="font-semibold text-slate-700">{formatDate(data.updatedAt)}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Fonte: <span className="font-semibold">Tbl_VariableData_BloombergMatrix</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Fundos monitorados
          </div>
          <div className="mt-3 text-4xl font-bold text-[#002d72]">{metricCount}</div>
          <div className="mt-2 text-sm text-slate-500">
            Inclui benchmarks e fundos do screening
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Portfolio 1Y
          </div>
          <div className="mt-3 text-4xl font-bold text-emerald-600">
            {formatPercent(portfolioSummary.return1YAnn)}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Sharpe: {formatNumber(portfolioSummary.sharpe1Y)} | Vol:{' '}
            {formatPercent(portfolioSummary.vol1Y)}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Portfolio 3Y
          </div>
          <div className="mt-3 text-4xl font-bold text-emerald-600">
            {formatPercent(portfolioSummary.return3YAnn)}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Sharpe: {formatNumber(portfolioSummary.sharpe3Y)} | Vol:{' '}
            {formatPercent(portfolioSummary.vol3Y)}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Portfolio 5Y
          </div>
          <div className="mt-3 text-4xl font-bold text-emerald-600">
            {formatPercent(portfolioSummary.return5YAnn)}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Sharpe: {formatNumber(portfolioSummary.sharpe5Y)} | Vol:{' '}
            {formatPercent(portfolioSummary.vol5Y)}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-[#002d72]">Top 5 do Ranking</h2>
            <Link href="/ranking" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
              Ver tela completa
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Ordem</th>
                  <th className="pb-3 pr-4 font-semibold">Fundo</th>
                  <th className="pb-3 pr-4 font-semibold">Score</th>
                  <th className="pb-3 pr-4 font-semibold">1Y</th>
                  <th className="pb-3 pr-4 font-semibold">Sharpe 1Y</th>
                </tr>
              </thead>
              <tbody>
                {topRanked.map((row) => (
                  <tr key={row.sqlColumn} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-semibold text-[#002d72]">{row.order}</td>
                    <td className="py-3 pr-4 font-medium text-slate-800">{row.name}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {row.aggregateScore?.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 pr-4 text-emerald-600">
                      {formatPercent(row.metrics?.return1Y)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatNumber(row.metrics?.sharpe1Y)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-[#002d72]">Pesos do Portfólio</h2>
            <Link href="/portfolio" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
              Ver tela completa
            </Link>
          </div>

          <div className="space-y-3">
            {selectedWeights.map((item) => (
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
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Link
          href="/metrics"
          className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="text-lg font-bold text-[#002d72]">Metrics</div>
          <p className="mt-2 text-sm text-slate-500">
            Todas as métricas por fundo, com quartis, benchmarks e fundos selecionados destacados.
          </p>
        </Link>

        <Link
          href="/ranking"
          className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="text-lg font-bold text-[#002d72]">Ranking</div>
          <p className="mt-2 text-sm text-slate-500">
            Ajuste os pesos de cada métrica e recalcule o score ponderado em tempo real.
          </p>
        </Link>

        <Link
          href="/portfolio"
          className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="text-lg font-bold text-[#002d72]">Portfolio</div>
          <p className="mt-2 text-sm text-slate-500">
            Pesos atuais, métricas consolidadas e gráfico de performance do portfólio versus IBOV e CDI.
          </p>
        </Link>

        <Link
          href="/backtest"
          className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="text-lg font-bold text-[#002d72]">Backtest</div>
          <p className="mt-2 text-sm text-slate-500">
            Compare os métodos HRP e MPT, com pesos, performance histórica e correlação.
          </p>
        </Link>
      </section>
    </div>
  );
}