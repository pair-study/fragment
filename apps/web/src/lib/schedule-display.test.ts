import { describe, expect, it } from "vitest";
import type { ScheduleAssignment } from "@fragment/shared";

import {
  formatScheduleAssignmentTime,
  formatScheduleAssignmentTimeRange,
  getScheduleTimeRangeLabel,
  getWorkerNamesPreview,
  groupSchedulesByTime,
} from "./schedule-display";

const createAssignment = (overrides: Partial<ScheduleAssignment> = {}): ScheduleAssignment => ({
  employeeCodeSnapshot: "W-0001",
  endsAt: "2026-07-01T14:00:00.000Z",
  id: "1",
  scheduleId: "1",
  startsAt: "2026-07-01T10:00:00.000Z",
  workerId: "1",
  workerNameSnapshot: "김민수",
  workDate: "2026-07-01",
  ...overrides,
});

describe("schedule display helpers", () => {
  it("formats assignment times relative to the work date", () => {
    expect(formatScheduleAssignmentTime("2026-07-01", "2026-07-01T22:00:00.000Z")).toBe("22:00");
    expect(formatScheduleAssignmentTime("2026-07-01", "2026-07-02T02:00:00.000Z")).toBe("02:00+1");
  });

  it("adds the next-day prefix for both start and end times when needed", () => {
    expect(
      formatScheduleAssignmentTimeRange(
        createAssignment({
          endsAt: "2026-07-02T03:00:00.000Z",
          startsAt: "2026-07-02T01:00:00.000Z",
        }),
      ),
    ).toBe("익일 01:00-익일 03:00");
  });

  it("groups schedules by time and sorts groups", () => {
    const groups = groupSchedulesByTime([
      { endTime: "14:00", startTime: "10:00", workerName: "김민수" },
      { endTime: "11:00", startTime: "09:00", workerName: "이서연" },
      { endTime: "14:00", startTime: "10:00", workerName: "박준호" },
    ]);

    expect(groups.map(getScheduleTimeRangeLabel)).toEqual(["09:00-11:00", "10:00-14:00"]);
    expect(groups[1]?.workerNames).toEqual(["김민수", "박준호"]);
  });

  it("uses display times for schedule group labels when present", () => {
    const [group] = groupSchedulesByTime([
      {
        displayEndTime: "익일 02:00",
        displayStartTime: "22:00",
        endTime: "02:00",
        startTime: "22:00",
        workerName: "김민수",
      },
    ]);

    expect(group ? getScheduleTimeRangeLabel(group) : "").toBe("22:00-익일 02:00");
  });

  it("truncates worker name previews with hidden counts", () => {
    expect(getWorkerNamesPreview(["김민수", "이서연", "박준호"])).toBe("김민수, 이서연 외 1명");
  });
});
