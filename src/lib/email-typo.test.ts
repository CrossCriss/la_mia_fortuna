import { describe, expect, it } from "vitest";
import { suggestEmailFix } from "./email-typo";

describe("suggestEmailFix", () => {
  it.each([
    ["a@gmail.co", "a@gmail.com"],
    ["a@gmail.cm", "a@gmail.com"],
    ["a@gmal.com", "a@gmail.com"],
    ["a@gmial.com", "a@gmail.com"],
    ["a@ukr.ner", "a@ukr.net"],
    ["a@ukr.nt", "a@ukr.net"],
    ["a@GMAIL.COM.UA", null],
  ])("%s -> %s", (input, expected) => {
    expect(suggestEmailFix(input)).toBe(expected);
  });

  it("точні збіги, далекі домени, порожнє", () => {
    expect(suggestEmailFix("a@gmail.com")).toBeNull();
    expect(suggestEmailFix("a@ukr.net")).toBeNull();
    expect(suggestEmailFix("a@company.com.ua")).toBeNull();
    expect(suggestEmailFix("a@example.com")).toBeNull();
    expect(suggestEmailFix("")).toBeNull();
    expect(suggestEmailFix("abc")).toBeNull();
  });

  it("короткі домени не чіпає", () => {
    expect(suggestEmailFix("a@i.u")).toBeNull();
  });

  it.each([
    "mail.com", "ymail.com", "email.com", "gmx.com", "gmx.net", "live.com", "me.com", "mac.com",
    "msn.com", "aol.com", "mail.ua", "ukr.net", "i.ua", "meta.ua", "gmail.com.ua", "yandex.ru",
    "yandex.ua", "rambler.ru", "inbox.ru", "list.ru", "bk.ru", "mail.ru", "protonmail.com",
    "pm.me", "tutanota.com", "zoho.com", "gmail.com", "outlook.com", "icloud.com",
  ])("справжній домен %s без підказки", (domain) => {
    expect(suggestEmailFix(`a@${domain}`)).toBeNull();
  });
});
