import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTurnstileEnabled, verifyTurnstileToken } from "./turnstile";

const fetchMock = vi.fn();

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status });
}

describe("turnstile", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("disabled без ключа, fetch не вызывается", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    expect(isTurnstileEnabled()).toBe(false);
    expect(await verifyTurnstileToken("tok", "1.2.3.4")).toBe("disabled");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("failed при пустом токене, fetch не вызывается", async () => {
    expect(await verifyTurnstileToken(undefined, null)).toBe("failed");
    expect(await verifyTurnstileToken("", null)).toBe("failed");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ok при success true, тело содержит secret, response, remoteip", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    expect(await verifyTurnstileToken("tok", "1.2.3.4")).toBe("ok");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("test-secret");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("1.2.3.4");
  });

  it("remoteip не передается при unknown и null", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await verifyTurnstileToken("tok", "unknown");
    await verifyTurnstileToken("tok", null);
    for (const call of fetchMock.mock.calls) {
      expect((call[1].body as URLSearchParams).has("remoteip")).toBe(false);
    }
  });

  it("failed при success false", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false }));
    expect(await verifyTurnstileToken("tok", null)).toBe("failed");
  });

  it("unavailable при HTTP не 2xx", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    expect(await verifyTurnstileToken("tok", null)).toBe("unavailable");
  });

  it("unavailable при ошибке сети", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    expect(await verifyTurnstileToken("tok", null)).toBe("unavailable");
  });

  it("unavailable при невалидном JSON", async () => {
    fetchMock.mockResolvedValue(new Response("not json", { status: 200 }));
    expect(await verifyTurnstileToken("tok", null)).toBe("unavailable");
  });

  it("unavailable по таймауту", async () => {
    fetchMock.mockImplementation(
      (_u: string, init: { signal: AbortSignal }) =>
        new Promise((_res, rej) => {
          init.signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
        }),
    );
    expect(await verifyTurnstileToken("tok", null, { timeoutMs: 20 })).toBe("unavailable");
  });
});
