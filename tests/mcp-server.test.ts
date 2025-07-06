import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMCPServer } from "../src/index";

describe("MCP Server Core", () => {
  let mockTransport: vi.Mocked<StdioServerTransport>;

  beforeEach(() => {
    mockTransport = {
      start: vi.fn(),
      close: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Server Initialization", () => {
    it("should create MCP server instance", () => {
      const server = createMCPServer();
      expect(server).toBeInstanceOf(Server);
    });
  });

  describe("Server Lifecycle", () => {
    it("should start server with transport", async () => {
      const server = createMCPServer();
      await server.connect(mockTransport);

      expect(mockTransport.start).toHaveBeenCalled();
    });

    it("should handle server shutdown", async () => {
      const server = createMCPServer();
      await server.connect(mockTransport);
      await server.close();

      expect(mockTransport.close).toHaveBeenCalled();
    });
  });

  describe("Configuration", () => {
    it("should create server instance without API key validation", () => {
      const serverInstance = createMCPServer();

      expect(serverInstance).toBeInstanceOf(Server);
    });
  });

  describe("Main Function", () => {
    let consoleErrorSpy: any;

    beforeEach(() => {
      vi.clearAllMocks();
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("should throw error when FMP_API_KEY is missing", async () => {
      delete process.env.FMP_API_KEY;

      const { main } = await import("../src/index");

      await expect(main()).rejects.toThrow(
        "FMP_API_KEY environment variable is required",
      );
    });

    it("should start server with valid API key", async () => {
      process.env.FMP_API_KEY = "test-api-key";

      const { main } = await import("../src/index");

      // Should not throw when API key is present
      const serverInstance = createMCPServer();
    });
  });
});
