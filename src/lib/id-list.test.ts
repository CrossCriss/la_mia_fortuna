import { describe, expect, it } from "vitest";
import { keepIds, pushRecentId, toggleId } from "./id-list";

describe("toggleId", () => {
  it("додає новий id на початок", () => {
    expect(toggleId(["a", "b"], "c", 10)).toEqual(["c", "a", "b"]);
  });

  it("прибирає id, якщо він уже є", () => {
    expect(toggleId(["a", "b", "c"], "b", 10)).toEqual(["a", "c"]);
  });

  it("обрізає з кінця, не перевищуючи max", () => {
    expect(toggleId(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
  });

  it("max = 0 дає порожній список при додаванні", () => {
    expect(toggleId([], "a", 0)).toEqual([]);
  });

  it("працює з порожнім масивом", () => {
    expect(toggleId([], "a", 5)).toEqual(["a"]);
  });

  it("не мутує вхідний масив", () => {
    const input = ["a", "b"];
    toggleId(input, "a", 5);
    toggleId(input, "z", 5);
    expect(input).toEqual(["a", "b"]);
  });
});

describe("pushRecentId", () => {
  it("ставить новий id на початок", () => {
    expect(pushRecentId(["a", "b"], "c", 10)).toEqual(["c", "a", "b"]);
  });

  it("переміщує повторний id на початок без дубля", () => {
    expect(pushRecentId(["a", "b", "c"], "b", 10)).toEqual(["b", "a", "c"]);
  });

  it("обрізає список до max", () => {
    expect(pushRecentId(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
  });

  it("працює з порожнім масивом", () => {
    expect(pushRecentId([], "a", 3)).toEqual(["a"]);
  });

  it("не мутує вхідний масив", () => {
    const input = ["a", "b", "c"];
    pushRecentId(input, "b", 2);
    expect(input).toEqual(["a", "b", "c"]);
  });
});

describe("keepIds", () => {
  it("залишає лише дозволені id з збереженням порядку", () => {
    expect(keepIds(["c", "a", "x", "b"], new Set(["a", "b", "c"]))).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("порожній набір дозволених дає порожній список", () => {
    expect(keepIds(["a", "b"], new Set())).toEqual([]);
  });

  it("порожній вхід дає порожній список", () => {
    expect(keepIds([], new Set(["a"]))).toEqual([]);
  });

  it("не мутує вхідний масив", () => {
    const input = ["a", "x"];
    keepIds(input, new Set(["a"]));
    expect(input).toEqual(["a", "x"]);
  });
});
