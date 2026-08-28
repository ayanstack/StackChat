import capabilitiesService from "../src/services/capabilities.service.js";

describe("Capabilities Service Unit Tests", () => {
  test("should return system capabilities structure", async () => {
    const caps = await capabilitiesService.getSystemCapabilities({});

    expect(caps.version).toBeDefined();
    expect(caps.capabilities).toBeDefined();
    expect(caps.capabilities.chat).toBeDefined();
    expect(caps.capabilities.memory.enabled).toBe(true);
    expect(caps.capabilities.csvAnalysis.enabled).toBe(true);
    expect(caps.capabilities.vision).toBeDefined();
    expect(caps.capabilities.deepResearch).toBeDefined();
  });
});
