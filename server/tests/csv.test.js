import csvService from "../src/services/csv.service.js";

describe("CSV Service Unit Tests", () => {
  const sampleCsv = `Name,Department,Salary,Age,Active
Alice,Engineering,95000,29,true
Bob,Marketing,65000,34,true
Charlie,Engineering,110000,42,false
Diana,Sales,72000,28,true
Edward,Marketing,,38,false`;

  test("should parse CSV text correctly into headers and rows", () => {
    const { headers, rows } = csvService.parseCsvText(sampleCsv);

    expect(headers).toEqual(["Name", "Department", "Salary", "Age", "Active"]);
    expect(rows).toHaveLength(5);
    expect(rows[0].Name).toBe("Alice");
    expect(rows[0].Salary).toBe(95000);
    expect(rows[0].Active).toBe(true);
    expect(rows[4].Salary).toBeNull();
  });

  test("should analyze CSV data and produce statistics for numeric columns", () => {
    const { headers, rows } = csvService.parseCsvText(sampleCsv);
    const analysis = csvService.analyzeCsvData(headers, rows);

    expect(analysis.rowCount).toBe(5);
    expect(analysis.columnCount).toBe(5);
    expect(analysis.columns.Salary.type).toBe("number");
    expect(analysis.columns.Salary.missingCount).toBe(1);
    expect(analysis.columns.Salary.stats.sum).toBe(342000);
    expect(analysis.columns.Salary.stats.min).toBe(65000);
    expect(analysis.columns.Salary.stats.max).toBe(110000);
  });

  test("should query, filter, sort, and paginate CSV rows", () => {
    const { rows } = csvService.parseCsvText(sampleCsv);

    // Filter where Age > 30
    const filtered = csvService.queryCsvData(rows, {
      filters: [{ column: "Age", operator: "gt", value: 30 }],
      sortBy: "Age",
      sortOrder: "desc",
    });

    expect(filtered.total).toBe(3);
    expect(filtered.data[0].Name).toBe("Charlie");
    expect(filtered.data[1].Name).toBe("Edward");
    expect(filtered.data[2].Name).toBe("Bob");
  });

  test("should aggregate CSV data with groupBy", () => {
    const { rows } = csvService.parseCsvText(sampleCsv);

    const agg = csvService.aggregateCsvData(rows, {
      groupBy: "Department",
      aggregateColumn: "Salary",
      operation: "avg",
    });

    const eng = agg.find((g) => g.group === "Engineering");
    expect(eng).toBeDefined();
    expect(eng.value).toBe(102500); // (95000 + 110000)/2
  });

  test("should generate chart data for frontend", () => {
    const { rows } = csvService.parseCsvText(sampleCsv);

    const chart = csvService.generateChartData(rows, {
      chartType: "bar",
      xAxis: "Department",
      yAxis: "Salary",
      operation: "sum",
    });

    expect(chart.chartType).toBe("bar");
    expect(chart.labels).toContain("Engineering");
    expect(chart.datasets[0].data).toBeDefined();
  });
});
