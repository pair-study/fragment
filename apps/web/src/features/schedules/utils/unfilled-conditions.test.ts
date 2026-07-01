import { describe, expect, it } from "vitest";

import {
  getShortageCount,
  getUnfilledConditionPreview,
  groupUnfilledConditionsByDate,
  type UnfilledCondition,
} from "./unfilled-conditions";

const createCondition = (overrides: Partial<UnfilledCondition> = {}): UnfilledCondition => ({
  assignedWorkers: 0,
  date: "2026-07-01",
  dayLabel: "수요일",
  id: "condition-1",
  requiredWorkers: 1,
  timeRange: "10:00-14:00",
  ...overrides,
});

describe("schedule page unfilled condition helpers", () => {
  it("groups conditions by date and sorts dates and time ranges", () => {
    const groups = groupUnfilledConditionsByDate([
      createCondition({
        date: "2026-07-02",
        dayLabel: "목요일",
        id: "condition-3",
        timeRange: "14:00-18:00",
      }),
      createCondition({
        date: "2026-07-01",
        id: "condition-2",
        timeRange: "15:00-18:00",
      }),
      createCondition({
        date: "2026-07-01",
        id: "condition-1",
        timeRange: "09:00-12:00",
      }),
    ]);

    expect(groups.map((group) => group.date)).toEqual(["2026-07-01", "2026-07-02"]);
    expect(groups[0]?.conditions.map((condition) => condition.timeRange)).toEqual([
      "09:00-12:00",
      "15:00-18:00",
    ]);
  });

  it("clamps shortage counts at zero", () => {
    expect(getShortageCount(createCondition({ assignedWorkers: 3, requiredWorkers: 2 }))).toBe(0);
    expect(getShortageCount(createCondition({ assignedWorkers: 1, requiredWorkers: 3 }))).toBe(2);
  });

  it("truncates preview text with hidden condition counts", () => {
    const preview = getUnfilledConditionPreview([
      createCondition({ id: "condition-1", timeRange: "09:00-10:00" }),
      createCondition({ id: "condition-2", timeRange: "10:00-11:00" }),
      createCondition({ id: "condition-3", timeRange: "11:00-12:00" }),
      createCondition({ id: "condition-4", timeRange: "12:00-13:00" }),
    ]);

    expect(preview).toBe(
      "09:00-10:00 1명 부족 · 10:00-11:00 1명 부족 · 11:00-12:00 1명 부족 · +1개",
    );
  });
});
