export type ApiId = string;
export type DatabaseId = string | number | bigint;

export const toApiId = (id: DatabaseId): ApiId => {
  if (typeof id === "bigint") {
    return id.toString();
  }

  if (typeof id === "number") {
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new RangeError("ID must be a non-negative safe integer.");
    }

    return id.toString();
  }

  if (!/^\d+$/.test(id)) {
    throw new RangeError("ID must be a numeric string.");
  }

  return id;
};

export const toNullableApiId = (id: DatabaseId | null | undefined): ApiId | null =>
  id == null ? null : toApiId(id);

export const toPrismaId = (id: DatabaseId): bigint => BigInt(toApiId(id));
