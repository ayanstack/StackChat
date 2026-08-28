import { z } from "zod";

export const csvQuerySchema = z.object({
  body: z.object({
    rows: z.array(z.record(z.any())).min(1, "Rows array is required"),
    filters: z
      .array(
        z.object({
          column: z.string().min(1),
          operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in"]),
          value: z.any(),
        })
      )
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(1000).optional(),
  }),
});

export const csvAggregateSchema = z.object({
  body: z.object({
    rows: z.array(z.record(z.any())).min(1, "Rows array is required"),
    groupBy: z.string().optional(),
    aggregateColumn: z.string().optional(),
    operation: z.enum(["sum", "avg", "min", "max", "count"]).optional(),
  }),
});

export const csvChartSchema = z.object({
  body: z.object({
    rows: z.array(z.record(z.any())).min(1, "Rows array is required"),
    chartType: z.enum(["bar", "line", "pie", "area"]).optional(),
    xAxis: z.string().min(1, "xAxis column is required"),
    yAxis: z.string().optional(),
    operation: z.enum(["sum", "avg", "min", "max", "count"]).optional(),
  }),
});
