import Image from 'next/image';
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

function formatDateTime(dateValue: string | null | undefined) {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleString('pt-BR');
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
    <div className="space-y-6 bg-[#D9D9D9] min-h-screen -mx-6 -mt-8 px-6 py-8">
      <section className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-5">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[#003C4C]/5 p-2 ring-1 ring-[#BFBFBF]">
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
                Dados calculados a partir da base
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-[#003C4C]">
                Equity Dashboard — Screening de FIAs
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[#52768D]">
            Fundos monitorados
          </div>
          <div className="mt-4 text-5xl font-bold text-[#003C4C]">{metricCount}</div>
          <div className="mt-3 text-sm text-[#808080]">
            Inclui benchmarks e fundos do screening
          </div>
        </div>

        <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[#52768D]">
            Portfolio 1Y
          </div>
          <div className="mt-4 text-5xl font-bold text-[#003C4C]">
            {formatPercent(portfolioSummary.return1YAnn)}
          </div>
          <div className="mt-3 text-sm text-[#808080]">
            Sharpe: {formatNumber(portfolioSummary.sharpe1Y)} | Vol:{' '}
            {formatPercent(portfolioSummary.vol1Y)}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[#52768D]">
            Portfolio 3Y
          </div>
          <div className="mt-4 text-5xl font-bold text-[#003C4C]">
            {formatPercent(portfolioSummary.return3YAnn)}
          </div>
          <div className="mt-3 text-sm text-[#808080]">
            Sharpe: {formatNumber(portfolioSummary.sharpe3Y)} | Vol:{' '}
            {formatPercent(portfolioSummary.vol3Y)}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[#52768D]">
            Portfolio 5Y
          </div>
          <div className="mt-4 text-5xl font-bold text-[#003C4C]">
            {formatPercent(portfolioSummary.return5YAnn)}
          </div>
          <div className="mt-3 text-sm text-[#808080]">
            Sharpe: {formatNumber(portfolioSummary.sharpe5Y)} | Vol:{' '}
            {formatPercent(portfolioSummary.vol5Y)}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b border-[#D9D9D9] pb-4">
            <h2 className="text-2xl font-bold text-[#003C4C]">Top 5 do Ranking</h2>
            <Link
              href="/ranking"
              className="text-sm font-semibold text-[#52768D] transition hover:text-[#003C4C]"
            >
              Ver tela completa
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#D9D9D9] text-left text-[#52768D]">
                  <th className="pb-3 pr-4 font-semibold">Ordem</th>
                  <th className="pb-3 pr-4 font-semibold">Fundo</th>
                  <th className="pb-3 pr-4 font-semibold">Score</th>
                  <th className="pb-3 pr-4 font-semibold">1Y</th>
                  <th className="pb-3 pr-4 font-semibold">Sharpe 1Y</th>
                </tr>
              </thead>
              <tbody>
                {topRanked.map((row) => (
                  <tr key={row.sqlColumn} className="border-b border-[#F1F1F1]">
                    <td className="py-3 pr-4 font-semibold text-[#003C4C]">{row.order}</td>
                    <td className="py-3 pr-4 font-medium text-[#003C4C]">{row.name}</td>
                    <td className="py-3 pr-4 text-[#52768D]">
                      {row.aggregateScore?.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 pr-4 text-[#003C4C]">
                      {formatPercent(row.metrics?.return1Y)}
                    </td>
                    <td className="py-3 pr-4 text-[#52768D]">
                      {formatNumber(row.metrics?.sharpe1Y)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b border-[#D9D9D9] pb-4">
            <h2 className="text-2xl font-bold text-[#003C4C]">Pesos do Portfólio</h2>
            <Link
              href="/portfolio"
              className="text-sm font-semibold text-[#52768D] transition hover:text-[#003C4C]"
            >
              Ver tela completa
            </Link>
          </div>

          <div className="space-y-3">
            {selectedWeights.map((item) => (
              <div
                key={item.sqlColumn}
                className="flex items-center justify-between rounded-2xl border border-[#D9D9D9] bg-[#F7F8FA] px-4 py-3"
              >
                <span className="text-sm font-medium text-[#003C4C]">{item.name}</span>
                <span className="text-sm font-semibold text-[#52768D]">
                  {formatWeight(item.weight)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Link
          href="/metrics"
          className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#A6BBCA] hover:shadow-md"
        >
          <div className="text-xl font-bold text-[#003C4C]">Metrics</div>
          <p className="mt-3 text-sm leading-6 text-[#808080]">
            Todas as métricas por fundo, com quartis, benchmarks e fundos selecionados destacados.
          </p>
        </Link>

        <Link
          href="/ranking"
          className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#A6BBCA] hover:shadow-md"
        >
          <div className="text-xl font-bold text-[#003C4C]">Ranking</div>
          <p className="mt-3 text-sm leading-6 text-[#808080]">
            Ajuste os pesos de cada métrica e recalcule o score ponderado em tempo real.
          </p>
        </Link>

        <Link
          href="/portfolio"
          className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#A6BBCA] hover:shadow-md"
        >
          <div className="text-xl font-bold text-[#003C4C]">Portfolio</div>
          <p className="mt-3 text-sm leading-6 text-[#808080]">
            Pesos atuais, métricas consolidadas e gráfico de performance do portfólio versus IBOV e CDI.
          </p>
        </Link>

        <Link
          href="/backtest"
          className="rounded-[28px] border border-[#BFBFBF] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#A6BBCA] hover:shadow-md"
        >
          <div className="text-xl font-bold text-[#003C4C]">Backtest</div>
          <p className="mt-3 text-sm leading-6 text-[#808080]">
            Compare os métodos HRP e MPT, com pesos, performance histórica e correlação.
          </p>
        </Link>
      </section>
    </div>
  );
}