import { describe, expect, it } from "vitest";
import { isOptimizableImage } from "./image";

describe("isOptimizableImage", () => {
  it("приймає https supabase з публічним шляхом сховища", () => {
    expect(
      isOptimizableImage("https://abc.supabase.co/storage/v1/object/public/products/a.jpg")
    ).toBe(true);
  });

  it("відхиляє інший шлях supabase", () => {
    expect(isOptimizableImage("https://abc.supabase.co/storage/v1/object/sign/a.jpg")).toBe(false);
    expect(isOptimizableImage("https://abc.supabase.co/rest/v1/products")).toBe(false);
  });

  it("відхиляє http", () => {
    expect(
      isOptimizableImage("http://abc.supabase.co/storage/v1/object/public/products/a.jpg")
    ).toBe(false);
  });

  it("відхиляє чужий хост", () => {
    expect(isOptimizableImage("https://example.com/storage/v1/object/public/a.jpg")).toBe(false);
  });

  it("відхиляє підроблений хост supabase.co.evil.com", () => {
    expect(
      isOptimizableImage("https://supabase.co.evil.com/storage/v1/object/public/a.jpg")
    ).toBe(false);
    expect(
      isOptimizableImage("https://evilsupabase.co/storage/v1/object/public/a.jpg")
    ).toBe(false);
  });

  it("відхиляє відносні шляхи", () => {
    expect(isOptimizableImage("/reviews/01.jpg")).toBe(false);
  });

  it("відхиляє порожній рядок і сміття", () => {
    expect(isOptimizableImage("")).toBe(false);
    expect(isOptimizableImage("not a url")).toBe(false);
    expect(isOptimizableImage("https://")).toBe(false);
  });
});
