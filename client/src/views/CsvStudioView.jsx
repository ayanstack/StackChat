import React, { useState } from "react";
import { FileSpreadsheet, Upload, BarChart3, Calculator, Layers, AlertCircle, ChevronDown, Check } from "lucide-react";
import { csvApi } from "../services/api.js";

export default function CsvStudioView() {
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chartResult, setChartResult] = useState(null);
  const [aggResult, setAggResult] = useState(null);

  // Aggregation form state
  const [groupByCol, setGroupByCol] = useState("");
  const [aggCol, setAggCol] = useState("");
  const [aggOp, setAggOp] = useState("sum");

  // Chart form state
  const [chartType, setChartType] = useState("bar");
  const [chartX, setChartX] = useState("");
  const [chartY, setChartY] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      const res = await csvApi.analyzeFile(formData);
      setCsvData(res.data);
      const headers = res.data?.summary?.headers || [];
      if (headers.length > 0) {
        setGroupByCol(headers[0]);
        setChartX(headers[0]);
      }
      if (headers.length > 1) {
        setAggCol(headers[1]);
        setChartY(headers[1]);
      }
    } catch (err) {
      setError(err.message || "Failed to parse CSV file");
    } finally {
      setLoading(false);
    }
  };

  const handleAggregate = async () => {
    if (!csvData?.rows) return;
    try {
      setLoading(true);
      const res = await csvApi.aggregate({
        rows: csvData.rows,
        groupBy: groupByCol,
        aggregateColumn: aggCol,
        operation: aggOp,
      });
      setAggResult(res.data);
    } catch (err) {
      setError(err.message || "Aggregation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChart = async () => {
    if (!csvData?.rows || !chartX) return;
    try {
      setLoading(true);
      const res = await csvApi.generateChart({
        rows: csvData.rows,
        chartType,
        xAxis: chartX,
        yAxis: chartY,
        operation: aggOp,
      });
      setChartResult(res.data);
    } catch (err) {
      setError(err.message || "Chart generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1160, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            CSV Data Analytics Studio
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
            Perform in-memory data modeling, statistical summarization, grouping, and multi-series chart visualizations.
          </p>
        </div>

        <label className="btn btn-primary" style={{ cursor: "pointer" }}>
          <Upload size={14} />
          <span>Upload CSV File</span>
          <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
        </label>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.25)",
            color: "var(--accent-rose)",
            fontSize: "0.82rem",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!csvData && !loading && (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "64px 20px",
            border: "1px dashed var(--border-subtle)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div
            className="brand-glyph"
            style={{
              width: 44,
              height: 44,
              margin: "0 auto 16px",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <FileSpreadsheet size={22} />
          </div>

          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Select a CSV file to inspect & analyze
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 440, margin: "6px auto 20px" }}>
            Instant header parsing, missing value health checks, numeric statistics, and grouped bar/line chart rendering.
          </p>

          <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
            <Upload size={14} />
            <span>Choose File</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
        </div>
      )}

      {csvData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Key Metric Ribbon */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <div className="card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Total Rows</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                {csvData.summary?.rowCount?.toLocaleString() || 0}
              </div>
            </div>
            <div className="card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Total Columns</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-primary)", marginTop: 4 }}>
                {csvData.summary?.columnCount || 0}
              </div>
            </div>
            <div className="card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Data Quality</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-emerald)", marginTop: 4 }}>
                100% Parsed
              </div>
            </div>
          </div>

          {/* Column Statistics & Health Breakdown */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Calculator size={15} color="var(--accent-primary)" />
              <span>Column Schema & Statistical Indicators</span>
            </h3>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Type</th>
                    <th>Missing Count</th>
                    <th>Unique Values</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Average</th>
                    <th>Median</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(csvData.summary?.columns || {}).map(([colName, col]) => (
                    <tr key={colName}>
                      <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{colName}</td>
                      <td>
                        <span className="badge badge-active">{col.type}</span>
                      </td>
                      <td>{col.missingCount} ({col.missingPercentage}%)</td>
                      <td>{col.uniqueCount}</td>
                      <td>{col.stats?.min !== undefined ? col.stats.min : "—"}</td>
                      <td>{col.stats?.max !== undefined ? col.stats.max : "—"}</td>
                      <td>{col.stats?.avg !== undefined ? col.stats.avg : "—"}</td>
                      <td>{col.stats?.median !== undefined ? col.stats.median : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabular Preview */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 12 }}>Dataset Preview</h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {(csvData.summary?.headers || []).map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(csvData.sampleRows || []).slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      {(csvData.summary?.headers || []).map((h) => (
                        <td key={h}>{row[h] !== null ? String(row[h]) : "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytical Controls Split: Aggregations & Visualizations */}
          <div className="grid-two-col">
            {/* Aggregation Tool */}
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Layers size={15} color="var(--accent-primary)" />
                <span>Group & Aggregate</span>
              </h3>

              <div className="input-group">
                <label className="input-label">Group By Column</label>
                <select className="select-field" value={groupByCol} onChange={(e) => setGroupByCol(e.target.value)}>
                  {(csvData.summary?.headers || []).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Target Metric Column</label>
                <select className="select-field" value={aggCol} onChange={(e) => setAggCol(e.target.value)}>
                  {(csvData.summary?.headers || []).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Operation</label>
                <select className="select-field" value={aggOp} onChange={(e) => setAggOp(e.target.value)}>
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                  <option value="count">Count</option>
                </select>
              </div>

              <button className="btn btn-primary" onClick={handleAggregate} style={{ width: "100%", marginTop: 6 }}>
                Calculate Aggregation
              </button>

              {aggResult && (
                <div style={{ marginTop: 14 }} className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Group</th>
                        <th>Value</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggResult.map((item, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{item.group}</td>
                          <td>{item.value}</td>
                          <td>{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Chart Tool */}
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart3 size={15} color="var(--accent-sky)" />
                <span>Visual Chart Renderer</span>
              </h3>

              <div className="input-group">
                <label className="input-label">Chart Type</label>
                <select className="select-field" value={chartType} onChange={(e) => setChartType(e.target.value)}>
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="area">Area Chart</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">X-Axis Column</label>
                <select className="select-field" value={chartX} onChange={(e) => setChartX(e.target.value)}>
                  {(csvData.summary?.headers || []).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Y-Axis Column</label>
                <select className="select-field" value={chartY} onChange={(e) => setChartY(e.target.value)}>
                  {(csvData.summary?.headers || []).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-secondary" onClick={handleGenerateChart} style={{ width: "100%", marginTop: 6 }}>
                Render Visualization
              </button>

              {chartResult && (
                <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--bg-app)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-hairline)" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
                    {chartResult.chartType.toUpperCase()} Chart — {chartResult.xAxis} vs {chartResult.yAxis}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {chartResult.labels?.map((label, idx) => {
                      const val = chartResult.datasets?.[0]?.data?.[idx] || 0;
                      const max = chartResult.summary?.maxValue || 1;
                      const pct = Math.min(100, Math.max(8, (val / max) * 100));
                      return (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 80, fontSize: "0.76rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {label}
                          </span>
                          <div style={{ flex: 1, height: 14, background: "var(--bg-surface-elevated)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent-primary)", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: "0.76rem", fontWeight: 600, width: 50, textAlign: "right", fontFamily: "var(--font-mono)" }}>
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
