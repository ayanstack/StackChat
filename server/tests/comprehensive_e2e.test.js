import request from "supertest";
import app from "../src/app.js";
import { generateAccessToken } from "../src/helpers/tokenHelper.js";
import User from "../src/models/user.model.js";
import csvService from "../src/services/csv.service.js";
import { jest } from "@jest/globals";

describe("Comprehensive StackChat End-to-End API Audit", () => {
  let mockToken;
  const mockUserId = "507f1f77bcf86cd799439011";

  const mockUserInstance = {
    _id: mockUserId,
    name: "Audit Tester",
    email: "audit@stackchat.io",
    role: "user",
    isDeleted: false,
  };

  beforeAll(() => {
    mockToken = generateAccessToken({ userId: mockUserId, email: "audit@stackchat.io" });
    jest.spyOn(User, "findById").mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(mockUserInstance),
    }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // 1. Health & Base Routes
  test("GET /health returns 200 and healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  test("GET /non-existent-route returns 404 with structured error", async () => {
    const res = await request(app).get("/api/v1/unknown-endpoint");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // 2. Authentication Enforcement on Protected Routes
  test("Unauthenticated requests to protected endpoints return 401", async () => {
    const endpoints = [
      { method: "get", path: "/api/v1/conversations" },
      { method: "get", path: "/api/v1/memory" },
      { method: "get", path: "/api/v1/integrations" },
      { method: "get", path: "/api/v1/analytics/me" },
      { method: "post", path: "/api/v1/csv/analyze" },
      { method: "post", path: "/api/v1/ai/summarize" },
      { method: "post", path: "/api/v1/vision/analyze" },
      { method: "post", path: "/api/v1/research/run" },
      { method: "post", path: "/api/v1/voice/synthesize" },
    ];

    for (const ep of endpoints) {
      const res = await request(app)[ep.method](ep.path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  // 3. Validation Enforcement (Zod Schemas)
  test("Invalid payloads to endpoints return 400 with validation errors", async () => {
    // Auth register without required fields
    const res1 = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "invalid-email" });
    expect(res1.status).toBe(400);
    expect(res1.body.success).toBe(false);

    // AI summarize with empty text
    const res2 = await request(app)
      .post("/api/v1/ai/summarize")
      .set("Authorization", `Bearer ${mockToken}`)
      .send({ text: "" });
    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);

    // CSV analyze without csvText or file
    const res3 = await request(app)
      .post("/api/v1/csv/analyze")
      .set("Authorization", `Bearer ${mockToken}`)
      .send({});
    expect(res3.status).toBe(400);
    expect(res3.body.success).toBe(false);

    // Invalid ObjectId format for conversation
    const res4 = await request(app)
      .get("/api/v1/conversations/invalid-id-123")
      .set("Authorization", `Bearer ${mockToken}`);
    expect(res4.status).toBe(400);
  });

  // 4. Capabilities Hub
  test("GET /api/v1/capabilities returns structured capability matrix", async () => {
    const res = await request(app)
      .get("/api/v1/capabilities")
      .set("Authorization", `Bearer ${mockToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.capabilities).toBeDefined();
    expect(res.body.data.capabilities.chat).toBeDefined();
    expect(res.body.data.capabilities.memory.enabled).toBe(true);
    expect(res.body.data.capabilities.csvAnalysis.enabled).toBe(true);
  });

  // 5. Integrations Hub
  test("GET /api/v1/integrations returns supported third-party providers", async () => {
    const res = await request(app)
      .get("/api/v1/integrations")
      .set("Authorization", `Bearer ${mockToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((i) => i.id === "google-drive")).toBe(true);
    expect(res.body.data.some((i) => i.id === "github")).toBe(true);
  });

  // 6. CSV Processing & Chart Generation
  test("POST /api/v1/csv/analyze and /chart work end-to-end", async () => {
    const csvText = "Product,Category,Revenue\nWidget A,Hardware,100\nWidget B,Hardware,200\nSaaS Basic,Software,150";

    const analyzeRes = await request(app)
      .post("/api/v1/csv/analyze")
      .set("Authorization", `Bearer ${mockToken}`)
      .send({ csvText });

    expect(analyzeRes.status).toBe(200);
    expect(analyzeRes.body.success).toBe(true);
    expect(analyzeRes.body.data.totalRows).toBe(3);
    expect(analyzeRes.body.data.summary.columns.Revenue.stats.sum).toBe(450);

    const { rows } = csvService.parseCsvText(csvText);

    const chartRes = await request(app)
      .post("/api/v1/csv/chart")
      .set("Authorization", `Bearer ${mockToken}`)
      .send({
        rows,
        chartType: "bar",
        xAxis: "Category",
        yAxis: "Revenue",
        operation: "sum",
      });

    expect(chartRes.status).toBe(200);
    expect(chartRes.body.success).toBe(true);
    expect(chartRes.body.data.chartType).toBe("bar");
    expect(chartRes.body.data.labels).toContain("Hardware");
  });

  // 7. Graceful NOT_CONFIGURED responses for unconfigured external providers
  test("Unconfigured optional providers return graceful 503 errors without crashing server", async () => {
    // Places search
    const placesRes = await request(app)
      .post("/api/v1/places/search")
      .set("Authorization", `Bearer ${mockToken}`)
      .send({ query: "coffee" });
    expect([200, 503]).toContain(placesRes.status);

    // Web search
    const webRes = await request(app)
      .post("/api/v1/web-search/query")
      .set("Authorization", `Bearer ${mockToken}`)
      .send({ query: "What is AI?" });
    expect([200, 503]).toContain(webRes.status);

    // Image generation
    const imgRes = await request(app)
      .post("/api/v1/image-generation/generate")
      .set("Authorization", `Bearer ${mockToken}`)
      .send({ prompt: "A beautiful scenery" });
    expect([200, 503]).toContain(imgRes.status);

    // Voice TTS
    const voiceRes = await request(app)
      .post("/api/v1/voice/synthesize")
      .set("Authorization", `Bearer ${mockToken}`)
      .send({ text: "Hello from StackChat" });
    expect([200, 503]).toContain(voiceRes.status);
  });
});
