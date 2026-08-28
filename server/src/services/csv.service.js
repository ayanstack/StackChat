import ApiError from "../utils/ApiError.js";

/**
 * Robust native CSV parser supporting quoted values, escaped quotes, commas, and newlines.
 * @param {string} text - Raw CSV text
 * @returns {Array<Object>} Parsed records as array of objects
 */
export function parseCsvText(text) {
  if (!text || typeof text !== "string") {
    throw ApiError.badRequest("Invalid or empty CSV content");
  }

  const lines = [];
  let currentRow = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    throw ApiError.badRequest("CSV file is empty");
  }

  const headers = lines[0].map((h) => h.replace(/^["']|["']$/g, "").trim());
  const rows = [];

  for (let r = 1; r < lines.length; r++) {
    const line = lines[r];
    const rowObj = {};
    headers.forEach((header, colIdx) => {
      let rawVal = line[colIdx] !== undefined ? line[colIdx] : "";
      // Type inference: Number, Boolean, or String
      if (rawVal === "" || rawVal === null || rawVal === undefined) {
        rowObj[header] = null;
      } else if (!isNaN(Number(rawVal)) && rawVal.trim() !== "") {
        rowObj[header] = Number(rawVal);
      } else if (rawVal.toLowerCase() === "true") {
        rowObj[header] = true;
      } else if (rawVal.toLowerCase() === "false") {
        rowObj[header] = false;
      } else {
        rowObj[header] = rawVal;
      }
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Analyzes CSV structure, data types, missing values, and column statistics.
 */
export function analyzeCsvData(headers, rows) {
  const rowCount = rows.length;
  const columnCount = headers.length;
  const columnSummary = {};

  headers.forEach((col) => {
    const values = rows.map((r) => r[col]);
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== "");
    const missingCount = rowCount - nonNullValues.length;

    const numericValues = nonNullValues.filter((v) => typeof v === "number" && !isNaN(v));
    const isNumeric = numericValues.length > 0 && numericValues.length >= nonNullValues.length * 0.8;

    const uniqueSet = new Set(nonNullValues);

    const summary = {
      column: col,
      type: isNumeric ? "number" : "string",
      totalCount: rowCount,
      missingCount,
      missingPercentage: rowCount > 0 ? Number(((missingCount / rowCount) * 100).toFixed(2)) : 0,
      uniqueCount: uniqueSet.size,
    };

    if (isNumeric && numericValues.length > 0) {
      const sum = numericValues.reduce((acc, v) => acc + v, 0);
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const avg = Number((sum / numericValues.length).toFixed(4));

      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

      const variance =
        numericValues.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) /
        numericValues.length;
      const stdDev = Number(Math.sqrt(variance).toFixed(4));

      summary.stats = {
        sum: Number(sum.toFixed(4)),
        avg,
        min,
        max,
        median,
        stdDev,
        count: numericValues.length,
      };
    }

    columnSummary[col] = summary;
  });

  return {
    rowCount,
    columnCount,
    headers,
    columns: columnSummary,
  };
}

/**
 * Filter, sort, paginate, and query CSV records.
 */
export function queryCsvData(rows, options = {}) {
  let result = [...rows];
  const { filters, sortBy, sortOrder = "asc", limit = 100, page = 1 } = options;

  // Apply filters: [{ column: 'age', operator: 'gt', value: 25 }]
  if (Array.isArray(filters) && filters.length > 0) {
    result = result.filter((row) => {
      return filters.every((f) => {
        const val = row[f.column];
        const target = f.value;

        switch (f.operator) {
          case "eq":
            return String(val).toLowerCase() === String(target).toLowerCase();
          case "neq":
            return String(val).toLowerCase() !== String(target).toLowerCase();
          case "gt":
            return Number(val) > Number(target);
          case "gte":
            return Number(val) >= Number(target);
          case "lt":
            return Number(val) < Number(target);
          case "lte":
            return Number(val) <= Number(target);
          case "contains":
            return String(val || "").toLowerCase().includes(String(target).toLowerCase());
          case "in":
            return Array.isArray(target) && target.map(String).includes(String(val));
          default:
            return true;
        }
      });
    });
  }

  // Apply sorting
  if (sortBy) {
    result.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "desc" ? valB - valA : valA - valB;
      }

      return sortOrder === "desc"
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB));
    });
  }

  const total = result.length;
  const startIndex = (page - 1) * limit;
  const paginatedRows = result.slice(startIndex, startIndex + Number(limit));

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    data: paginatedRows,
  };
}

/**
 * Aggregates CSV data by grouping and calculating sum/avg/min/max/count.
 */
export function aggregateCsvData(rows, { groupBy, aggregateColumn, operation = "count" }) {
  if (!rows || !Array.isArray(rows)) {
    throw ApiError.badRequest("CSV data must be an array of rows");
  }

  const groups = {};

  rows.forEach((row) => {
    const key = groupBy ? String(row[groupBy] ?? "Uncategorized") : "All";
    if (!groups[key]) {
      groups[key] = [];
    }
    if (aggregateColumn) {
      const num = Number(row[aggregateColumn]);
      if (!isNaN(num)) groups[key].push(num);
    } else {
      groups[key].push(1);
    }
  });

  const result = Object.keys(groups).map((key) => {
    const values = groups[key];
    let aggValue = 0;

    switch (operation) {
      case "sum":
        aggValue = values.reduce((a, b) => a + b, 0);
        break;
      case "avg":
        aggValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        break;
      case "min":
        aggValue = values.length > 0 ? Math.min(...values) : 0;
        break;
      case "max":
        aggValue = values.length > 0 ? Math.max(...values) : 0;
        break;
      case "count":
      default:
        aggValue = values.length;
        break;
    }

    return {
      group: key,
      value: Number(aggValue.toFixed(4)),
      count: values.length,
    };
  });

  return result;
}

/**
 * Formats CSV data for frontend charting (bar, line, pie, area).
 */
export function generateChartData(rows, { chartType = "bar", xAxis, yAxis, operation = "sum" }) {
  if (!xAxis) {
    throw ApiError.badRequest("xAxis column is required for chart generation");
  }

  const aggregated = aggregateCsvData(rows, {
    groupBy: xAxis,
    aggregateColumn: yAxis,
    operation,
  });

  const labels = aggregated.map((item) => item.group);
  const data = aggregated.map((item) => item.value);

  return {
    chartType,
    xAxis,
    yAxis: yAxis || "count",
    operation,
    labels,
    datasets: [
      {
        label: `${operation.toUpperCase()} of ${yAxis || "count"}`,
        data,
      },
    ],
    summary: {
      totalPoints: labels.length,
      maxValue: Math.max(...data, 0),
      minValue: Math.min(...data, 0),
    },
  };
}

export default {
  parseCsvText,
  analyzeCsvData,
  queryCsvData,
  aggregateCsvData,
  generateChartData,
};
