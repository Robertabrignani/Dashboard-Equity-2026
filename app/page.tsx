import data from '@/data/portfolio.json';

type SummaryCard = {
  title: string;
  value: string;
  subtitle: string;
  positive: boolean;
};

type Asset = {
  key: string;
  label: string;
  shortLabel: string;
  color: string;
  firstValue: number;
  lastValue: number;
  ytdReturn: number;
};

type SeriesRow = {
  date: string;
  [key: string]: string | number | null;
};

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  return date.toLocaleDateString('pt-BR');
}

export default function Home() {
  const summaryCards = (data.summaryCards ?? []) as SummaryCard[];
  const assets = (data.assets ?? []) as Asset[];
  const series = ((data.series ?? []).filter((row) => row?.date)) as SeriesRow[];

  const latestRow = series[series.length - 1];
  const recentRows = series.slice(-12);
  const maxAbsReturn = Math.max(...assets.map((item) => Math.abs(item.ytdReturn)), 1);

  const chartWidth = Math.max(assets.length * 96, 560);
  const latestTableWidth = Math.max(220 + assets.length * 140, 1200);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 overflow-x-auto">
      <header className="bg-[#002d72] text-white shadow-sm">
        <div className="w-full px-6">
          <div className="flex h-16 items-center gap-10 overflow-x-auto whitespace-nowrap text-sm font-semibold">
            <span className="border-b-2 border-sky-400 pb-1">RIO DAS PEDRAS MFO</span>
            <span className="text-slate-200">Fundos Terceiros</span>
            <span className="text-slate-300">Dashboard</span>
            <span className="text-slate-300">Séries Históricas</span>
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-8">
        <section className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                Dados exportados da base
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#002d72]">
                Dashboard — Fundos Terceiros
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Última atualização:{' '}
                <span className="font-semibold text-slate-700">
                  {latestRow ? formatDate(latestRow.date) : 'Sem dados'}
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Fonte: <span className="font-semibold">portfolio.json</span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {summaryCards.map((card) => (
            <div key={card.title} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {card.title}
              </div>
              <div
                className={`mt-3 text-4xl font-bold ${
                  card.positive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {card.value}
              </div>
              <div className="mt-2 text-sm text-slate-500">{card.subtitle}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 2xl:grid-cols-[1.25fr,0.95fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 border-b border-slate-200 pb-3 text-xl font-bold text-[#002d72]">
              Todos os fundos e benchmarks
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-3 pr-4 font-semibold">Série</th>
                    <th className="pb-3 pr-4 font-semibold">Valor inicial</th>
                    <th className="pb-3 pr-4 font-semibold">Valor atual</th>
                    <th className="pb-3 pr-4 font-semibold">Retorno YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((item) => (
                    <tr key={item.key} className="border-b border-slate-100">
                      <td className="py-3 pr-4 min-w-[260px]">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-slate-800 whitespace-nowrap">
                            {item.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                        {formatNumber(item.firstValue)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                        {formatNumber(item.lastValue)}
                      </td>
                      <td
                        className={`py-3 pr-4 font-semibold whitespace-nowrap ${
                          item.ytdReturn >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatPercent(item.ytdReturn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="text-xl font-bold text-[#002d72]">Retorno YTD</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Todas as séries
              </div>
            </div>

            <div className="overflow-x-auto">
              <div
                className="flex h-80 items-end gap-4 pt-6"
                style={{ minWidth: `${chartWidth}px` }}
              >
                {assets.map((item) => {
                  const height = Math.max((Math.abs(item.ytdReturn) / maxAbsReturn) * 180, 20);
                  const positive = item.ytdReturn >= 0;

                  return (
                    <div
                      key={item.key}
                      className="flex min-w-[84px] flex-col items-center justify-end gap-2"
                    >
                      <div
                        className={`text-sm font-bold ${
                          positive ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatPercent(item.ytdReturn)}
                      </div>

                      <div className="flex h-56 items-end">
                        <div
                          className={`w-16 rounded-t-xl ${
                            positive ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                          style={{ height }}
                        />
                      </div>

                      <div className="w-20 text-center text-xs font-semibold text-slate-500 break-words">
                        {item.shortLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-slate-200 pb-3 text-xl font-bold text-[#002d72]">
            Últimos pontos da série
          </div>

          <div className="overflow-x-auto">
            <table
              className="text-sm"
              style={{ minWidth: `${latestTableWidth}px`, width: '100%' }}
            >
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 pr-4 font-semibold sticky left-0 bg-white min-w-[140px]">
                    Data
                  </th>
                  {assets.map((asset) => (
                    <th
                      key={asset.key}
                      className="pb-3 pr-4 font-semibold whitespace-nowrap min-w-[140px]"
                    >
                      {asset.shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row, index) => (
                  <tr key={`${row.date}-${index}`} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-700 sticky left-0 bg-white whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    {assets.map((asset) => (
                      <td key={asset.key} className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                        {row[asset.key] == null ? '-' : formatNumber(Number(row[asset.key]))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-6 rounded-3xl bg-white p-6 text-xs leading-6 text-slate-500 shadow-sm">
          Material meramente informativo, com uso restrito, sem constituição de oferta ou recomendação individualizada de investimento.
          Rentabilidade passada não representa garantia de resultados futuros.
        </footer>
      </main>
    </div>
  );
}