export type ApiId = string;
export type DatabaseId = string | number | bigint;

export const toApiId = (id: DatabaseId): ApiId => {
  if (typeof id === "bigint") {
    if (id < BigInt(0)) {
      throw new RangeError("ID는 0 이상의 정수여야 합니다.");
    }

    return id.toString();
  }

  if (typeof id === "number") {
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new RangeError("ID는 0 이상의 안전한 정수여야 합니다.");
    }

    return BigInt(id).toString();
  }

  if (!/^\d+$/.test(id)) {
    throw new RangeError("ID는 숫자 문자열이어야 합니다.");
  }

  return BigInt(id).toString();
};

export const toNullableApiId = (id: DatabaseId | null | undefined): ApiId | null =>
  id == null ? null : toApiId(id);

export const toPrismaId = (id: DatabaseId): bigint => BigInt(toApiId(id));
