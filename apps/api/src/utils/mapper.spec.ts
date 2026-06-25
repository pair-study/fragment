import { describe, expect, it } from "@jest/globals";

import { toApiId, toNullableApiId, toPrismaId } from "@/utils/mapper";

describe("mapper", () => {
  it("converts supported database IDs to API string IDs", () => {
    expect(toApiId(BigInt(1))).toBe("1");
    expect(toApiId(2)).toBe("2");
    expect(toApiId("003")).toBe("3");
  });

  it("rejects invalid database IDs", () => {
    expect(() => toApiId(-1)).toThrow(RangeError);
    expect(() => toApiId(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => toApiId("abc")).toThrow(RangeError);
  });

  it("maps nullable IDs and Prisma IDs", () => {
    expect(toNullableApiId(null)).toBeNull();
    expect(toNullableApiId(undefined)).toBeNull();
    expect(toPrismaId("42")).toBe(BigInt(42));
  });
});
