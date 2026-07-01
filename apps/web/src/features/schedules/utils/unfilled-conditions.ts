export type UnfilledCondition = {
  id: string;
  assignedWorkers: number;
  date: string;
  dayLabel: string;
  requiredWorkers: number;
  timeRange: string;
};

export type UnfilledConditionGroup = {
  conditions: UnfilledCondition[];
  date: string;
  dayLabel: string;
};

const MAX_PREVIEW_UNFILLED_CONDITIONS = 3;

export function groupUnfilledConditionsByDate(
  conditions: UnfilledCondition[],
): UnfilledConditionGroup[] {
  const groupsByDate = new Map<string, UnfilledConditionGroup>();

  conditions.forEach((condition) => {
    const group = groupsByDate.get(condition.date);

    if (group) {
      group.conditions.push(condition);
      return;
    }

    groupsByDate.set(condition.date, {
      conditions: [condition],
      date: condition.date,
      dayLabel: condition.dayLabel,
    });
  });

  return [...groupsByDate.values()]
    .map((group) => ({
      ...group,
      conditions: [...group.conditions].sort((left, right) =>
        left.timeRange.localeCompare(right.timeRange),
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function getShortageCount(condition: UnfilledCondition) {
  return Math.max(condition.requiredWorkers - condition.assignedWorkers, 0);
}

export function getUnfilledConditionLabel(condition: UnfilledCondition) {
  return `${condition.timeRange} ${getShortageCount(condition)}명 부족`;
}

export function getUnfilledConditionPreview(conditions: UnfilledCondition[]) {
  const visibleConditions = conditions.slice(0, MAX_PREVIEW_UNFILLED_CONDITIONS);
  const hiddenConditionCount = conditions.length - visibleConditions.length;
  const visibleLabel = visibleConditions.map(getUnfilledConditionLabel).join(" · ");

  if (hiddenConditionCount <= 0) {
    return visibleLabel;
  }

  return `${visibleLabel} · +${hiddenConditionCount}개`;
}
