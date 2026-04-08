const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const LABEL_MAP = {
  'BZDIOVIN Index': 'CDI',
  'IBOV Index': 'Ibovespa',
  'RPDRFIA BZ EQUITY': 'Rio das Pedras FIA',
  'DYNCODO BZ EQUITY': 'Dynamo',
  'SPXFALC BZ EQUITY': 'SPX Falcon',
  'TRUXILB BZ EQUITY': 'Truxt',
  'NACFFIA BZ EQUITY': 'Navi',
  'ATMOSAC BZ EQUITY': 'Atmos',
  'STUFICF BZ EQUITY': 'Studio',
  'BSCAPLB BZ EQUITY': 'Brasil Capital',
  'CSH2182 BZ EQUITY': 'Compass 2182',
  'PEFORMF BZ EQUITY': 'Performa',
  'MSQUARE BZ EQUITY': 'M Square',
  'SQUAMAS BZ EQUITY': 'Squadra',
  'ABSPAR2 BZ EQUITY': 'Absolute',
  '3GRLBMS BZ EQUITY': '3G Radar',
  'POLACOE BZ EQUITY': 'Polo',
  'DRYBINC BZ EQUITY': 'Dryno',
  'BOGARIV BZ EQUITY': 'Bogari',
  'IPPRTAC BZ EQUITY': 'IP Participações',
  'CONMASF BZ Equity': 'Conquest'
};

const COLORS = [
  '#1e3a8a',
  '#2563eb',
  '#0f766e',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#65a30d',
  '#be123c',
  '#475569',
  '#9333ea',
  '#0d9488',
  '#ea580c',
  '#4f46e5',
  '#16a34a',
  '#e11d48',
  '#0284c7',
  '#a16207',
  '#334155',
  '#7e22ce',
  '#0369a1'
];

function getLabel(key) {
  return LABEL_MAP[key] || key.replace(' BZ EQUITY', '').replace(' Index', '');
}

function getShortLabel(key) {
  const label = getLabel(key);
  return label.length > 14 ? label.slice(0, 14) : label;
}

function calcReturn(lastValue, firstValue) {
  return ((lastValue / firstValue) - 1) * 100;
}

function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function toPlainNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function hasAnyValueChanged(currentRow, previousRow) {
  if (!previousRow) return true;

  const keys = Object.keys(currentRow).filter((key) => key !== 'date');

  return keys.some((key) => {
    const currentValue = currentRow[key];
    const previousValue = previousRow[key];
    return currentValue !== previousValue;
  });
}

async function main() {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  if (!config.user || !config.password || !config.server || !config.database) {
    throw new Error(
      'Faltam variáveis de ambiente em .env.local: DB_USER, DB_PASSWORD, DB_SERVER, DB_DATABASE'
    );
  }

  const pool = await sql.connect(config);

  const result = await pool.request().query(`
    SELECT TOP 1000
      [date],
      [BZDIOVIN Index],
      [IBOV Index],
      [RPDRFIA BZ EQUITY],
      [DYNCODO BZ EQUITY],
      [SPXFALC BZ EQUITY],
      [TRUXILB BZ EQUITY],
      [NACFFIA BZ EQUITY],
      [ATMOSAC BZ EQUITY],
      [STUFICF BZ EQUITY],
      [BSCAPLB BZ EQUITY],
      [CSH2182 BZ EQUITY],
      [PEFORMF BZ EQUITY],
      [MSQUARE BZ EQUITY],
      [SQUAMAS BZ EQUITY],
      [ABSPAR2 BZ EQUITY],
      [3GRLBMS BZ EQUITY],
      [POLACOE BZ EQUITY],
      [DRYBINC BZ EQUITY],
      [BOGARIV BZ EQUITY],
      [IPPRTAC BZ EQUITY],
      [CONMASF BZ Equity]
    FROM Tbl_VariableData_BloombergMatrix
    WHERE [date] >= '2026-01-01'
    ORDER BY [date] ASC
  `);

  const rawRows = result.recordset || [];

  const normalizedRows = rawRows
    .map((row) => {
      const normalized = { date: normalizeDate(row.date) };

      Object.keys(row).forEach((key) => {
        if (key !== 'date') {
          normalized[key] = toPlainNumber(row[key]);
        }
      });

      return normalized;
    })
    .filter((row) => row.date);

  const rows = normalizedRows.filter((row, index) => {
    const previousRow = index > 0 ? normalizedRows[index - 1] : null;
    return hasAnyValueChanged(row, previousRow);
  });

  if (!rows.length) {
    throw new Error('A consulta não retornou linhas úteis.');
  }

  const firstRow = rows[0];
  const lastRow = rows[rows.length - 1];

  const assetKeys = Object.keys(lastRow).filter((key) => key !== 'date');

  const assets = assetKeys
    .map((key, index) => {
      const firstValue = Number(firstRow[key]);
      const lastValue = Number(lastRow[key]);

      if (!Number.isFinite(firstValue) || !Number.isFinite(lastValue) || firstValue === 0) {
        return null;
      }

      const ytdReturn = calcReturn(lastValue, firstValue);

      return {
        key,
        label: getLabel(key),
        shortLabel: getShortLabel(key),
        color: COLORS[index % COLORS.length],
        firstValue,
        lastValue,
        ytdReturn
      };
    })
    .filter(Boolean);

  const summaryPriority = [
    'DYNCODO BZ EQUITY',
    'ATMOSAC BZ EQUITY',
    'IBOV Index',
    'BZDIOVIN Index'
  ];

  const summaryCards = summaryPriority
    .map((key) => assets.find((asset) => asset.key === key))
    .filter(Boolean)
    .map((asset) => ({
      title: `${asset.label} (YTD)`,
      value: formatPercent(asset.ytdReturn),
      subtitle: 'Desde 01/01/2026',
      positive: asset.ytdReturn >= 0
    }));

  const output = {
    summaryCards,
    assets,
    series: rows
  };

  const outputPath = path.join(process.cwd(), 'data', 'portfolio.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

  await pool.close();

  console.log(`portfolio.json gerado com sucesso em: ${outputPath}`);
  console.log(`Linhas originais: ${normalizedRows.length}`);
  console.log(`Linhas finais: ${rows.length}`);
}

main().catch((error) => {
  console.error('Erro ao gerar portfolio.json:');
  console.error(error);
  process.exit(1);
});
