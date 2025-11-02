import { NextRequest } from "next/server";
import { Buffer } from "buffer";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGenerate } = vi.hoisted(() => {
  return { mockGenerate: vi.fn() };
});

vi.mock("openai", () => {
  const OpenAI = vi.fn(() => ({
    images: {
      generate: mockGenerate,
    },
  }));
  return {
    __esModule: true,
    default: OpenAI,
  };
});


describe("POST /api/generate-image", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGenerate.mockClear();
    delete process.env.OPENAI_API_KEY;
  });

  it("should return a 400 error if the prompt is too long", async () => {
    const { POST } = await import("./route");
    const longPrompt = "a".repeat(4001);
    const request = new NextRequest("http://localhost/api/generate-image", {
      method: "POST",
      body: JSON.stringify({ prompt: longPrompt }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Prompt is too long");
  });

  it("should return a 200 success if the prompt is valid", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const { POST } = await import("./route");

    const validPrompt = "A cute cat";
    const request = new NextRequest("http://localhost/api/generate-image", {
      method: "POST",
      body: JSON.stringify({ prompt: validPrompt }),
    });

    mockGenerate.mockResolvedValue({
      data: [{ b64_json: Buffer.from("dummy-image-data").toString("base64") }],
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });
});
