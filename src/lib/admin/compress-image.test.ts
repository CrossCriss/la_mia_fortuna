import { describe, expect, it } from "vitest";
import { computeTargetSize } from "./compress-image";

describe("computeTargetSize", () => {
  it("зменшує альбомну картинку за шириною", () => {
    expect(computeTargetSize(4000, 3000)).toEqual({ width: 1600, height: 1200 });
  });

  it("зменшує портретну картинку за висотою", () => {
    expect(computeTargetSize(3000, 4000)).toEqual({ width: 1200, height: 1600 });
  });

  it("не збільшує малу картинку", () => {
    expect(computeTargetSize(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("зменшує квадратну картинку", () => {
    expect(computeTargetSize(3200, 3200)).toEqual({ width: 1600, height: 1600 });
  });

  it("не чіпає картинку рівно maxSide", () => {
    expect(computeTargetSize(1600, 900)).toEqual({ width: 1600, height: 900 });
    expect(computeTargetSize(900, 1600)).toEqual({ width: 900, height: 1600 });
  });

  it("поважає власний maxSide", () => {
    expect(computeTargetSize(2000, 1000, 1000)).toEqual({ width: 1000, height: 500 });
  });

  it("екстремальні пропорції не дають 0", () => {
    expect(computeTargetSize(100000, 10)).toEqual({ width: 1600, height: 1 });
    expect(computeTargetSize(10, 100000)).toEqual({ width: 1, height: 1600 });
  });

  it("повертає цілі числа", () => {
    const result = computeTargetSize(4001, 3001);
    expect(Number.isInteger(result.width)).toBe(true);
    expect(Number.isInteger(result.height)).toBe(true);
  });
});
