import Report from "../models/report.model.js";
import ApiError from "../utils/ApiError.js";

async function createReport(userId, { targetType, targetId, reason }) {
  return Report.create({ reportedBy: userId, targetType, targetId, reason });
}

async function listReports({ page, limit, status }) {
  const query = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reportedBy", "name email")
      .lean(),
    Report.countDocuments(query),
  ]);

  return { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function resolveReport(adminId, reportId, { status, adminNote }) {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound("Report not found");

  report.status = status;
  report.adminNote = adminNote || report.adminNote;
  report.resolvedBy = adminId;
  await report.save();

  return report;
}

export default { createReport, listReports, resolveReport };