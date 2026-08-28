import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import csvService from "../services/csv.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const uploadAndAnalyze = asyncHandler(async (req, res) => {
  let csvText = "";

  if (req.file) {
    csvText = req.file.buffer.toString("utf-8");
  } else if (req.body && req.body.csvText) {
    csvText = req.body.csvText;
  } else {
    throw ApiError.badRequest("Please upload a CSV file or provide csvText in body");
  }

  const { headers, rows } = csvService.parseCsvText(csvText);
  const analysis = csvService.analyzeCsvData(headers, rows);

  new ApiResponse(
    HTTP_STATUS.OK,
    {
      summary: analysis,
      sampleRows: rows.slice(0, 20),
      totalRows: rows.length,
      rows,
    },
    "CSV parsed and analyzed successfully"
  ).send(res);
});

export const queryCsv = asyncHandler(async (req, res) => {
  const result = csvService.queryCsvData(req.body.rows, req.body);
  new ApiResponse(HTTP_STATUS.OK, result, "CSV queried successfully").send(res);
});

export const aggregateCsv = asyncHandler(async (req, res) => {
  const result = csvService.aggregateCsvData(req.body.rows, req.body);
  new ApiResponse(HTTP_STATUS.OK, result, "CSV aggregated successfully").send(res);
});

export const generateChart = asyncHandler(async (req, res) => {
  const chartData = csvService.generateChartData(req.body.rows, req.body);
  new ApiResponse(HTTP_STATUS.OK, chartData, "Chart data generated successfully").send(res);
});

export default {
  uploadAndAnalyze,
  queryCsv,
  aggregateCsv,
  generateChart,
};
