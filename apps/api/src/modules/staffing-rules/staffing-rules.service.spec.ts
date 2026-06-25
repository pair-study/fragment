import type { PrismaClient } from "@fragment/database";
import { describe, expect, it, jest } from "@jest/globals";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { updateMinimumStaffingRule } from "./staffing-rules.service";

const timeOfDay = (hour: number, minute: number) => new Date(Date.UTC(1970, 0, 1, hour, minute));

describe("updateMinimumStaffingRule", () => {
  it("rejects endsNextDay-only updates when the merged time range is invalid", async () => {
    const organizationFindUnique = jest.fn<() => Promise<{ id: bigint }>>().mockResolvedValue({
      id: BigInt(1),
    });
    const minimumStaffingRuleFindFirst = jest
      .fn<
        () => Promise<{
          endTime: Date;
          endsNextDay: boolean;
          id: bigint;
          startTime: Date;
        }>
      >()
      .mockResolvedValue({
        id: BigInt(10),
        startTime: timeOfDay(10, 0),
        endTime: timeOfDay(14, 0),
        endsNextDay: false,
      });
    const minimumStaffingRuleUpdate = jest.fn();
    const prisma = {
      organization: {
        findUnique: organizationFindUnique,
      },
      minimumStaffingRule: {
        findFirst: minimumStaffingRuleFindFirst,
        update: minimumStaffingRuleUpdate,
      },
    } as unknown as PrismaClient;

    await expect(
      updateMinimumStaffingRule(prisma, "1", "10", {
        endsNextDay: true,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      statusCode: 400,
    });
    expect(minimumStaffingRuleUpdate).not.toHaveBeenCalled();
  });
});
