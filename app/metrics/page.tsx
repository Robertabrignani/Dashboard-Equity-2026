import data from '@/data/screening.json';

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

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function quartileClass(quartile: number | null | undefined) {
  if (quartile === 1) return 'bg-emerald-100 text-emerald-800';
  if (quartile === 2) return 'bg-lime-50 text-lime-800';
  if (quartile === 3) return 'bg-amber-50 text-amber-800';
  if (quartile === 4) return 'bg-rose-100 text-rose-800';
  return 'bg-slate-50 text-slate-700';
}

function rowClass(row: any) {
  if (row.isBenchmark) return 'bg-sky-50';
  if (row.isSelected) return 'bg-amber-50';
  return 'bg-white';
}

export default function MetricsPage() {
  const rows = data.metrics ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-[#002d72]">Metrics</h1>
        <p className="mt-2 text-sm text-slate-500">
          Métricas calculadas por fundo a partir das cotas diárias da base.
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-800">
            Selected Funds
          </span>
          <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-800">
            Benchmarks
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
            1º quartil
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-800">
            4º quartil
          </span>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1800px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="sticky left-0 bg-white pb-3 pr-4 font-semibold">Fundo</th>
                <th className="pb-3 pr-4 font-semibold">Ticker</th>
                <th className="pb-3 pr-4 font-semibold">Inception</th>
                <th className="pb-3 pr-4 font-semibold">Updated Last</th>
                <th className="pb-3 pr-4 font-semibold">1Y Return</th>
                <th className="pb-3 pr-4 font-semibold">3Y Ann.</th>
                <th className="pb-3 pr-4 font-semibold">5Y Ann.</th>
                <th className="pb-3 pr-4 font-semibold">Sharpe 1Y</th>
                <th className="pb-3 pr-4 font-semibold">Sharpe 3Y</th>
                <th className="pb-3 pr-4 font-semibold">Sharpe 5Y</th>
                <th className="pb-3 pr-4 font-semibold">Vol 90D</th>
                <th className="pb-3 pr-4 font-semibold">Vol 360D</th>
                <th className="pb-3 pr-4 font-semibold">Max DD 3Y</th>
                <th className="pb-3 pr-4 font-semibold">Max DD 5Y</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.sqlColumn} className={`border-b border-slate-100 ${rowClass(row)}`}>
                  <td className="sticky left-0 bg-inherit py-3 pr-4 font-medium text-slate-800">
                    {row.name}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{row.shortTicker}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatDate(row.inceptionDate)}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatDate(row.updatedLast)}</td>

                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.return1Y)}`}>
                      {formatPercent(row.metrics?.return1Y)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.return3YAnn)}`}>
                      {formatPercent(row.metrics?.return3YAnn)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.return5YAnn)}`}>
                      {formatPercent(row.metrics?.return5YAnn)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.sharpe1Y)}`}>
                      {formatNumber(row.metrics?.sharpe1Y)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.sharpe3Y)}`}>
                      {formatNumber(row.metrics?.sharpe3Y)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.sharpe5Y)}`}>
                      {formatNumber(row.metrics?.sharpe5Y)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.vol90D)}`}>
                      {formatPercent(row.metrics?.vol90D)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.vol360D)}`}>
                      {formatPercent(row.metrics?.vol360D)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.maxDrawdown3Y)}`}>
                      {formatPercent(row.metrics?.maxDrawdown3Y)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${quartileClass(row.quartiles?.maxDrawdown5Y)}`}>
                      {formatPercent(row.metrics?.maxDrawdown5Y)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
