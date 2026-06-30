import type { ScheduleAssignment } from "@fragment/shared";

export function formatScheduleAssignmentTimeRange(assignment: ScheduleAssignment) {
  const startTime = assignment.startsAt.slice(11, 16);
  const endTime = assignment.endsAt.slice(11, 16);
  const endPrefix =
    assignment.endsAt.slice(0, 10) > assignment.startsAt.slice(0, 10) ? "익일 " : "";

  return `${startTime}-${endPrefix}${endTime}`;
}
