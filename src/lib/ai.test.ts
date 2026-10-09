import { afterEach, describe, expect, it, vi } from "vitest";
import { listOllamaModels, pullOllamaModel, type AIConfig } from "@/lib/ai";

const config: AIConfig = {
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
  model: "llama3.2",
};

describe("listOllamaModels", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and deduplicates model names from the local Ollama API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        models: [{ name: "llama3.2:latest" }, { model: "qwen2.5:7b" }, { name: "llama3.2:latest" }],
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listOllamaModels(config)).resolves.toEqual(["llama3.2:latest", "qwen2.5:7b"]);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:11434/api/tags");
  });

  it("reports local API errors instead of returning an empty model list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Ollama is not running" }), { status: 503 }),
    ));

    await expect(listOllamaModels(config)).rejects.toThrow("Ollama is not running");
  });

  it("rejects a missing server address", async () => {
    await expect(listOllamaModels({ ...config, baseUrl: "" })).rejects.toThrow(
      "Add the Ollama server address first.",
    );
  });
});

describe("pullOllamaModel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("streams model download progress from the local Ollama API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        `${JSON.stringify({ status: "pulling", completed: 50, total: 100 })}\n${JSON.stringify({ status: "success" })}\n`,
        { status: 200 },
      ),
    );
    const onProgress = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await pullOllamaModel(config, "qwen2.5:0.5b", onProgress);

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:11434/api/pull", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ model: "qwen2.5:0.5b", stream: true }),
    }));
    expect(onProgress).toHaveBeenNthCalledWith(1, "pulling", 50, 100);
    expect(onProgress).toHaveBeenNthCalledWith(2, "success", undefined, undefined);
  });

  it("surfaces pull failures reported in the progress stream", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(`${JSON.stringify({ error: "model not found" })}\n`, { status: 200 }),
    ));

    await expect(pullOllamaModel(config, "missing", vi.fn())).rejects.toThrow("model not found");
  });
});
