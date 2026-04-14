const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const {
  ASSETS,
  CDI_SQL_COLUMN,
  DEFAULT_WEIGHTS,
  PORTFOLIO_WEIGHTS,
  BACKTEST_HRP_WEIGHTS,
  BACKTEST_MPT_WEIGHTS,
  METRIC_DIRECTIONS,
  SQL_START_DATE,
} = require('../config/screening.config');

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function toPlainNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function sum(values) {
  return values.reduce((acc, value) => acc + value, 0);
}

function mean(values) {
  if (!values.length) return null;
  return sum(values) / values.length;
}

function sampleStd(values) {
  if (values.length < 2) return null;
  const avg = mean(values);
  const variance =
    values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function round(value, digits = 6) {
  if (value == null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

function normalizeWeights(weightsObject) {
  const entries = Object.entries(weightsObject);
  const total = entries.reduce((acc, [, weight]) => acc + weight, 0);
  if (!total) return {};
  return Object.fromEntries(entries.map(([key, weight]) => [key, weight / total]));
}

function dedupeConsecutiveEqualRows(rows) {
  return rows.filter((row, index) => {
    if (index === 0) return true;
    const prev = rows[index - 1];
    const keys = Object.keys(row).filter((key) => key !== 'date');
    return keys.some((key) => row[key] !== prev[key]);
  });
}

function buildSeries(rows, sqlColumn) {
  return rows
    .map((row) => ({
      date: row.date,
      value: row[sqlColumn],
    }))
    .filter((item) => item.date && item.value != null && Number.isFinite(item.value));
}

function buildReturnSeriesFromLevelSeries(levelSeries) {
  const returns = [];
  for (let i = 1; i < levelSeries.length; i += 1) {
    const previous = levelSeries[i - 1].value;
    const current = levelSeries[i].value;

    if (
      previous == null ||
      current == null ||
      !Number.isFinite(previous) ||
      !Number.isFinite(current) ||
      previous === 0
    ) {
      continue;
    }

    returns.push({
      date: levelSeries[i].date,
      return: current / previous - 1,
    });
  }
  return returns;
}

function calculateWindowSimpleReturn(levelSeries, tradingDays) {
  if (levelSeries.length < tradingDays + 1) return null;
  const end = levelSeries[levelSeries.length - 1].value;
  const start = levelSeries[levelSeries.length - tradingDays - 1].value;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === 0) return null;
  return end / start - 1;
}

function calculateWindowAnnualizedReturn(levelSeries, tradingDays) {
  if (levelSeries.length < tradingDays + 1) return null;
  const end = levelSeries[levelSeries.length - 1].value;
  const start = levelSeries[levelSeries.length - tradingDays - 1].value;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === 0) return null;
  return (end / start) ** (252 / tradingDays) - 1;
}

function calculateWindowVolatility(returnSeries, tradingDays) {
  if (returnSeries.length < tradingDays) return null;
  const windowReturns = returnSeries.slice(-tradingDays).map((item) => item.return);
  const std = sampleStd(windowReturns);
  if (std == null) return null;
  return std * Math.sqrt(252);
}

function buildDrawdownSeries(levelSeries) {
  const result = [];
  let runningMax = -Infinity;

  for (const point of levelSeries) {
    if (point.value > runningMax) {
      runningMax = point.value;
    }

    const drawdown = runningMax > 0 ? point.value / runningMax - 1 : 0;
    result.push({
      date: point.date,
      value: point.value,
      drawdown,
    });
  }

  return result;
}

function calculateWindowMaxDrawdown(levelSeries, tradingDays) {
  if (levelSeries.length < tradingDays + 1) return null;
  const windowSeries = levelSeries.slice(-tradingDays - 1);
  const ddSeries = buildDrawdownSeries(windowSeries);
  const drawdowns = ddSeries.map((item) => item.drawdown).filter((value) => value != null);
  if (!drawdowns.length) return null;
  return Math.min(...drawdowns);
}

function calculateWindowSharpe(levelSeries, cdiLevelSeries, tradingDays) {
  const assetAnnualized = calculateWindowAnnualizedReturn(levelSeries, tradingDays);
  const cdiAnnualized = calculateWindowAnnualizedReturn(cdiLevelSeries, tradingDays);
  const vol = calculateWindowVolatility(buildReturnSeriesFromLevelSeries(levelSeries), tradingDays);

  if (assetAnnualized == null || cdiAnnualized == null || vol == null || vol === 0) {
    return null;
  }

  return (assetAnnualized - cdiAnnualized) / vol;
}

function computeQuartiles(rows, metricKey, direction) {
  const valid = rows
    .filter((row) => !row.isBenchmark && row.metrics[metricKey] != null)
    .map((row) => ({
      sqlColumn: row.sqlColumn,
      value: row.metrics[metricKey],
    }));

  valid.sort((a, b) => {
    return direction === 'asc' ? a.value - b.value : b.value - a.value;
  });

  const total = valid.length;
  const quartileMap = {};

  valid.forEach((item, index) => {
    const percentile = (index + 1) / total;
    let quartile = 4;
    if (percentile <= 0.25) quartile = 1;
    else if (percentile <= 0.5) quartile = 2;
    else if (percentile <= 0.75) quartile = 3;

    quartileMap[item.sqlColumn] = quartile;
  });

  return quartileMap;
}

function computeRanks(rows, metricKey, direction) {
  const valid = rows
    .filter((row) => !row.isBenchmark && row.metrics[metricKey] != null)
    .map((row) => ({
      sqlColumn: row.sqlColumn,
      value: row.metrics[metricKey],
    }));

  valid.sort((a, b) => {
    return direction === 'asc' ? a.value - b.value : b.value - a.value;
  });

  const rankMap = {};
  valid.forEach((item, index) => {
    rankMap[item.sqlColumn] = index + 1;
  });

  return rankMap;
}

function calculateWeightedScore(ranks, weights) {
  let score = 0;

  for (const [metricKey, weight] of Object.entries(weights)) {
    const rank = ranks[metricKey];
    if (rank == null) return null;
    score += rank * weight;
  }

  return score;
}

function buildPortfolioReturnSeries(rows, weights, cdiSqlColumn) {
  const entries = Object.entries(weights);
  const portfolioReturns = [];

  for (let i = 1; i < rows.length; i += 1) {
    const current = rows[i];
    const previous = rows[i - 1];
    let dailyReturn = 0;

    for (const [sqlColumn, weight] of entries) {
      if (sqlColumn === 'CASH') {
        const prevCdi = previous[cdiSqlColumn];
        const currCdi = current[cdiSqlColumn];
        if (
          prevCdi != null &&
          currCdi != null &&
          Number.isFinite(prevCdi) &&
          Number.isFinite(currCdi) &&
          prevCdi !== 0
        ) {
          dailyReturn += weight * (currCdi / prevCdi - 1);
        }
        continue;
      }

      const prevValue = previous[sqlColumn];
      const currValue = current[sqlColumn];

      if (
        prevValue == null ||
        currValue == null ||
        !Number.isFinite(prevValue) ||
        !Number.isFinite(currValue) ||
        prevValue === 0
      ) {
        continue;
      }

      dailyReturn += weight * (currValue / prevValue - 1);
    }

    portfolioReturns.push({
      date: current.date,
      return: dailyReturn,
    });
  }

  return portfolioReturns;
}

function buildNavSeriesFromReturns(returnSeries, startValue = 1) {
  const series = [];
  let nav = startValue;
  let runningMax = startValue;

  for (const point of returnSeries) {
    nav *= 1 + point.return;
    runningMax = Math.max(runningMax, nav);
    const drawdown = nav / runningMax - 1;

    series.push({
      date: point.date,
      nav,
      drawdown,
      return: point.return,
    });
  }

  return series;
}

function calculateAnnualizedFromNavSeries(navSeries, tradingDays) {
  if (navSeries.length < tradingDays) return null;
  const window = navSeries.slice(-tradingDays);
  const start = window[0].nav;
  const end = window[window.length - 1].nav;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === 0) return null;
  return (end / start) ** (252 / tradingDays) - 1;
}

function calculateVolFromReturnSeries(returnSeries, tradingDays) {
  if (returnSeries.length < tradingDays) return null;
  const windowReturns = returnSeries.slice(-tradingDays).map((item) => item.return);
  const std = sampleStd(windowReturns);
  if (std == null) return null;
  return std * Math.sqrt(252);
}

function calculateSharpeFromNavAndCdi(navSeries, cdiNavSeries, tradingDays) {
  const portfolioAnnualized = calculateAnnualizedFromNavSeries(navSeries, tradingDays);
  const cdiAnnualized = calculateAnnualizedFromNavSeries(cdiNavSeries, tradingDays);
  const portfolioReturnSeries = navSeries.map((item) => ({
    date: item.date,
    return: item.return,
  }));
  const vol = calculateVolFromReturnSeries(portfolioReturnSeries, tradingDays);

  if (portfolioAnnualized == null || cdiAnnualized == null || vol == null || vol === 0) {
    return null;
  }

  return (portfolioAnnualized - cdiAnnualized) / vol;
}

function buildSummaryFromNav(navSeries, cdiNavSeries) {
  return {
    return1YAnn: round(calculateAnnualizedFromNavSeries(navSeries, 252), 8),
    return3YAnn: round(calculateAnnualizedFromNavSeries(navSeries, 756), 8),
    return5YAnn: round(calculateAnnualizedFromNavSeries(navSeries, 1260), 8),
    sharpe1Y: round(calculateSharpeFromNavAndCdi(navSeries, cdiNavSeries, 252), 8),
    sharpe3Y: round(calculateSharpeFromNavAndCdi(navSeries, cdiNavSeries, 756), 8),
    sharpe5Y: round(calculateSharpeFromNavAndCdi(navSeries, cdiNavSeries, 1260), 8),
    vol1Y: round(
      calculateVolFromReturnSeries(
        navSeries.map((item) => ({ date: item.date, return: item.return })),
        252
      ),
      8
    ),
    vol3Y: round(
      calculateVolFromReturnSeries(
        navSeries.map((item) => ({ date: item.date, return: item.return })),
        756
      ),
      8
    ),
    vol5Y: round(
      calculateVolFromReturnSeries(
        navSeries.map((item) => ({ date: item.date, return: item.return })),
        1260
      ),
      8
    ),
    maxDrawdown5Y: round(
      (() => {
        const drawdowns = navSeries.map((item) => item.drawdown).filter((value) => value != null);
        return drawdowns.length ? Math.min(...drawdowns) : null;
      })(),
      8
    ),
  };
}

function correlation(valuesX, valuesY) {
  if (valuesX.length !== valuesY.length || valuesX.length < 2) return null;
  const meanX = mean(valuesX);
  const meanY = mean(valuesY);
  const stdX = sampleStd(valuesX);
  const stdY = sampleStd(valuesY);

  if (stdX == null || stdY == null || stdX === 0 || stdY === 0) return null;

  let cov = 0;
  for (let i = 0; i < valuesX.length; i += 1) {
    cov += (valuesX[i] - meanX) * (valuesY[i] - meanY);
  }
  cov /= valuesX.length - 1;

  return cov / (stdX * stdY);
}

function buildCorrelationMatrix(returnSeriesByAsset, orderedColumns) {
  const matrix = [];

  for (const left of orderedColumns) {
    const row = [];
    for (const right of orderedColumns) {
      const leftSeries = returnSeriesByAsset[left] || [];
      const rightSeries = returnSeriesByAsset[right] || [];

      const byDateLeft = new Map(leftSeries.map((item) => [item.date, item.return]));
      const alignedLeft = [];
      const alignedRight = [];

      for (const point of rightSeries) {
        if (byDateLeft.has(point.date)) {
          alignedLeft.push(byDateLeft.get(point.date));
          alignedRight.push(point.return);
        }
      }

      row.push(correlation(alignedLeft, alignedRight));
    }
    matrix.push(row);
  }

  return matrix;
}

function buildAverageLinkageFromCorrelation(matrix, labels) {
  const n = labels.length;
  if (n === 0) return [];

  const baseDistance = (i, j) => {
    const corr = matrix[i][j];
    if (corr == null) return 1;
    return 1 - corr;
  };

  let nextClusterId = n;
  let clusters = labels.map((label, index) => ({
    id: index,
    label,
    members: [index],
  }));

  const linkage = [];

  while (clusters.length > 1) {
    let bestPair = null;
    let bestDistance = Infinity;

    for (let i = 0; i < clusters.length; i += 1) {
      for (let j = i + 1; j < clusters.length; j += 1) {
        const left = clusters[i];
        const right = clusters[j];

        const distances = [];
        for (const li of left.members) {
          for (const rj of right.members) {
            distances.push(baseDistance(li, rj));
          }
        }

        const avgDistance = mean(distances);
        if (avgDistance < bestDistance) {
          bestDistance = avgDistance;
          bestPair = [i, j];
        }
      }
    }

    const [leftIndex, rightIndex] = bestPair;
    const leftCluster = clusters[leftIndex];
    const rightCluster = clusters[rightIndex];

    linkage.push({
      left: leftCluster.id,
      right: rightCluster.id,
      distance: round(bestDistance, 6),
      size: leftCluster.members.length + rightCluster.members.length,
    });

    const mergedCluster = {
      id: nextClusterId,
      label: `${leftCluster.label} + ${rightCluster.label}`,
      members: [...leftCluster.members, ...rightCluster.members],
    };

    nextClusterId += 1;

    clusters = clusters.filter((_, index) => index !== leftIndex && index !== rightIndex);
    clusters.push(mergedCluster);
  }

  return linkage;
}

function buildBacktestBlock(rows, weights, cdiSqlColumn) {
  const normalizedWeights = normalizeWeights(weights);
  const returnSeries = buildPortfolioReturnSeries(rows, normalizedWeights, cdiSqlColumn);
  const navSeries = buildNavSeriesFromReturns(returnSeries, 1);

  return {
    weights: Object.entries(normalizedWeights).map(([sqlColumn, weight]) => {
      const asset = ASSETS.find((item) => item.sqlColumn === sqlColumn);
      return {
        sqlColumn,
        name: asset ? asset.name : sqlColumn,
        weight: round(weight, 8),
      };
    }),
    returnSeries,
    navSeries,
  };
}

async function main() {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  if (!config.user || !config.password || !config.server || !config.database) {
    throw new Error(
      'Faltam variáveis em .env.local: DB_USER, DB_PASSWORD, DB_SERVER, DB_DATABASE'
    );
  }

  const columns = ['[date]']
    .concat(ASSETS.map((asset) => `[${asset.sqlColumn}]`))
    .concat(`[${CDI_SQL_COLUMN}]`);

  const query = `
    SELECT ${columns.join(',\n           ')}
    FROM [RDP_Database].[dbo].[Tbl_VariableData_BloombergMatrix]
    WHERE [date] >= '${SQL_START_DATE}'
    ORDER BY [date] ASC
  `;

  const pool = await sql.connect(config);
  const result = await pool.request().query(query);
  await pool.close();

  const rawRows = result.recordset || [];
  if (!rawRows.length) {
    throw new Error('A consulta SQL não retornou dados.');
  }

  const normalizedRows = rawRows
    .map((row) => {
      const normalized = { date: normalizeDate(row.date) };

      for (const asset of ASSETS) {
        normalized[asset.sqlColumn] = toPlainNumber(row[asset.sqlColumn]);
      }

      normalized[CDI_SQL_COLUMN] = toPlainNumber(row[CDI_SQL_COLUMN]);

      return normalized;
    })
    .filter((row) => row.date);

  const rows = dedupeConsecutiveEqualRows(normalizedRows);

  const cdiSeries = buildSeries(rows, CDI_SQL_COLUMN);
  const cdiReturnSeries = buildReturnSeriesFromLevelSeries(cdiSeries);
  const cdiNavSeries = buildNavSeriesFromReturns(cdiReturnSeries, 1);

  const metricRows = ASSETS.map((asset) => {
    const levelSeries = buildSeries(rows, asset.sqlColumn);
    const returnSeries = buildReturnSeriesFromLevelSeries(levelSeries);

    const metrics = {
      return1Y: calculateWindowSimpleReturn(levelSeries, 252),
      return3YAnn: calculateWindowAnnualizedReturn(levelSeries, 756),
      return5YAnn: calculateWindowAnnualizedReturn(levelSeries, 1260),
      sharpe1Y: calculateWindowSharpe(levelSeries, cdiSeries, 252),
      sharpe3Y: calculateWindowSharpe(levelSeries, cdiSeries, 756),
      sharpe5Y: calculateWindowSharpe(levelSeries, cdiSeries, 1260),
      vol90D: calculateWindowVolatility(returnSeries, 90),
      vol360D: calculateWindowVolatility(returnSeries, 360),
      maxDrawdown3Y: calculateWindowMaxDrawdown(levelSeries, 756),
      maxDrawdown5Y: calculateWindowMaxDrawdown(levelSeries, 1260),
    };

    return {
      sqlColumn: asset.sqlColumn,
      ticker: asset.ticker,
      shortTicker: asset.shortTicker,
      name: asset.name,
      isBenchmark: asset.isBenchmark,
      isSelected: Object.prototype.hasOwnProperty.call(PORTFOLIO_WEIGHTS, asset.sqlColumn),
      inceptionDate: levelSeries.length ? levelSeries[0].date : null,
      updatedLast: levelSeries.length ? levelSeries[levelSeries.length - 1].date : null,
      metrics: Object.fromEntries(
        Object.entries(metrics).map(([key, value]) => [key, round(value, 8)])
      ),
    };
  });

  const quartilesByMetric = {};
  const ranksByMetric = {};

  for (const metricKey of Object.keys(DEFAULT_WEIGHTS)) {
    quartilesByMetric[metricKey] = computeQuartiles(
      metricRows,
      metricKey,
      METRIC_DIRECTIONS[metricKey]
    );
    ranksByMetric[metricKey] = computeRanks(
      metricRows,
      metricKey,
      METRIC_DIRECTIONS[metricKey]
    );
  }

  const metricsRowsWithDecorations = metricRows.map((row) => {
    const quartiles = {};
    const ranks = {};

    for (const metricKey of Object.keys(DEFAULT_WEIGHTS)) {
      quartiles[metricKey] = quartilesByMetric[metricKey][row.sqlColumn] ?? null;
      ranks[metricKey] = ranksByMetric[metricKey][row.sqlColumn] ?? null;
    }

    return {
      ...row,
      quartiles,
      ranks,
    };
  });

  const rankingRows = metricsRowsWithDecorations.map((row) => {
    const aggregateScore = row.isBenchmark
      ? null
      : calculateWeightedScore(row.ranks, DEFAULT_WEIGHTS);

    return {
      sqlColumn: row.sqlColumn,
      ticker: row.ticker,
      shortTicker: row.shortTicker,
      name: row.name,
      isBenchmark: row.isBenchmark,
      isSelected: row.isSelected,
      metrics: row.metrics,
      quartiles: row.quartiles,
      ranks: row.ranks,
      aggregateScore: aggregateScore == null ? null : round(aggregateScore, 6),
    };
  });

  const sortableRankingRows = rankingRows
    .filter((row) => !row.isBenchmark && row.aggregateScore != null)
    .sort((a, b) => a.aggregateScore - b.aggregateScore)
    .map((row, index) => ({
      ...row,
      order: index + 1,
    }));

  const benchmarkRankingRows = rankingRows
    .filter((row) => row.isBenchmark)
    .map((row) => ({
      ...row,
      order: null,
    }));

  const finalRankingRows = [...sortableRankingRows, ...benchmarkRankingRows];

  const normalizedPortfolioWeights = normalizeWeights(PORTFOLIO_WEIGHTS);
  const portfolioReturnSeries = buildPortfolioReturnSeries(
    rows,
    normalizedPortfolioWeights,
    CDI_SQL_COLUMN
  );
  const portfolioNavSeries = buildNavSeriesFromReturns(portfolioReturnSeries, 1);

  const bovaSeries = buildSeries(rows, 'BOVA11 BZ Equity');
  const bovaReturnSeries = buildReturnSeriesFromLevelSeries(bovaSeries);
  const bovaNavSeries = buildNavSeriesFromReturns(bovaReturnSeries, 1);

  const portfolioSummaryBase = buildSummaryFromNav(portfolioNavSeries, cdiNavSeries);
  const portfolioSummary = {
    ...portfolioSummaryBase,
    ibov1YAnn: round(calculateAnnualizedFromNavSeries(bovaNavSeries, 252), 8),
    ibov3YAnn: round(calculateAnnualizedFromNavSeries(bovaNavSeries, 756), 8),
    ibov5YAnn: round(calculateAnnualizedFromNavSeries(bovaNavSeries, 1260), 8),
    cdi1YAnn: round(calculateAnnualizedFromNavSeries(cdiNavSeries, 252), 8),
    cdi3YAnn: round(calculateAnnualizedFromNavSeries(cdiNavSeries, 756), 8),
    cdi5YAnn: round(calculateAnnualizedFromNavSeries(cdiNavSeries, 1260), 8),
  };

  const portfolioSeries = portfolioNavSeries.map((item, index) => ({
    date: item.date,
    portfolioNav: round(item.nav, 8),
    portfolioDrawdown: round(item.drawdown, 8),
    portfolioDailyReturn: round(item.return, 8),
    ibovNav: bovaNavSeries[index] ? round(bovaNavSeries[index].nav, 8) : null,
    cdiNav: cdiNavSeries[index] ? round(cdiNavSeries[index].nav, 8) : null,
  }));

  const hrpBlock = buildBacktestBlock(rows, BACKTEST_HRP_WEIGHTS, CDI_SQL_COLUMN);
  const mptBlock = buildBacktestBlock(rows, BACKTEST_MPT_WEIGHTS, CDI_SQL_COLUMN);

  const correlationAssetColumns = Array.from(
    new Set([
      ...Object.keys(BACKTEST_HRP_WEIGHTS),
      ...Object.keys(BACKTEST_MPT_WEIGHTS),
    ])
  ).filter((key) => key !== 'CASH');

  const returnSeriesByAsset = {};
  for (const sqlColumn of correlationAssetColumns) {
    const levelSeries = buildSeries(rows, sqlColumn);
    returnSeriesByAsset[sqlColumn] = buildReturnSeriesFromLevelSeries(levelSeries);
  }

  const correlationMatrix = buildCorrelationMatrix(returnSeriesByAsset, correlationAssetColumns);
  const correlationLabels = correlationAssetColumns.map((sqlColumn) => {
    const asset = ASSETS.find((item) => item.sqlColumn === sqlColumn);
    return asset ? asset.name : sqlColumn;
  });

  const dendrogramLinkage = buildAverageLinkageFromCorrelation(
    correlationMatrix,
    correlationLabels
  );

  const screeningJson = {
    updatedAt: rows[rows.length - 1]?.date ?? null,
    source: {
      table: '[RDP_Database].[dbo].[Tbl_VariableData_BloombergMatrix]',
      startDate: SQL_START_DATE,
      rowCountRaw: normalizedRows.length,
      rowCountFiltered: rows.length,
    },
    weights: {
      ranking: DEFAULT_WEIGHTS,
      portfolio: normalizedPortfolioWeights,
      backtest: {
        hrp: normalizeWeights(BACKTEST_HRP_WEIGHTS),
        mpt: normalizeWeights(BACKTEST_MPT_WEIGHTS),
      },
    },
    metrics: metricsRowsWithDecorations,
    ranking: {
      defaultWeights: DEFAULT_WEIGHTS,
      rows: finalRankingRows,
    },
    portfolio: {
      weights: Object.entries(normalizedPortfolioWeights).map(([sqlColumn, weight]) => {
        if (sqlColumn === 'CASH') {
          return {
            sqlColumn: 'CASH',
            name: 'CASH',
            weight: round(weight, 8),
          };
        }

        const asset = ASSETS.find((item) => item.sqlColumn === sqlColumn);
        return {
          sqlColumn,
          name: asset ? asset.name : sqlColumn,
          weight: round(weight, 8),
        };
      }),
      summary: portfolioSummary,
      series: portfolioSeries,
    },
    backtest: {
      hrp: {
        weights: hrpBlock.weights,
        summary: buildSummaryFromNav(hrpBlock.navSeries, cdiNavSeries),
        series: hrpBlock.navSeries.map((item) => ({
          date: item.date,
          nav: round(item.nav, 8),
          drawdown: round(item.drawdown, 8),
          dailyReturn: round(item.return, 8),
        })),
      },
      mpt: {
        weights: mptBlock.weights,
        summary: buildSummaryFromNav(mptBlock.navSeries, cdiNavSeries),
        series: mptBlock.navSeries.map((item) => ({
          date: item.date,
          nav: round(item.nav, 8),
          drawdown: round(item.drawdown, 8),
          dailyReturn: round(item.return, 8),
        })),
      },
      correlation: {
        labels: correlationLabels,
        matrix: correlationMatrix.map((row) => row.map((value) => round(value, 6))),
        linkage: dendrogramLinkage,
      },
    },
  };

  const outputPath = path.join(process.cwd(), 'data', 'screening.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(screeningJson, null, 2), 'utf8');

  console.log(`screening.json gerado com sucesso em: ${outputPath}`);
  console.log(`Linhas brutas: ${normalizedRows.length}`);
  console.log(`Linhas filtradas: ${rows.length}`);
}

main().catch((error) => {
  console.error('Erro ao gerar screening.json:');
  console.error(error);
  process.exit(1);
});