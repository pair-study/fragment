import { z } from "zod";
import {
  activeSchedulePlanningPeriodResponseSchema,
  activeSchedulePlanningPeriodSchema,
  authLoginRequestSchema,
  authMeResponseSchema,
  authSessionResponseSchema,
  authSignupRequestSchema,
  availabilityListResponseSchema,
  availabilityQuerySchema,
  availabilitySchema,
  createMinimumStaffingRuleRequestSchema,
  createOrganizationRequestSchema,
  createWorkerRequestSchema,
  dashboardResponseSchema,
  draftScheduleQuerySchema,
  draftScheduleResponseSchema,
  errorCodeSchema,
  errorResponseSchema,
  minimumStaffingRuleSchema,
  minimumStaffingRulesListResponseSchema,
  organizationDetailSchema,
  organizationSummarySchema,
  recommendScheduleRequestSchema,
  replaceAvailabilityRequestSchema,
  scheduleAssignmentInputSchema,
  scheduleAssignmentSchema,
  scheduleCandidateSchema,
  scheduleDetailSchema,
  scheduleHistoryDetailResponseSchema,
  scheduleHistoryItemSchema,
  scheduleHistoryListResponseSchema,
  scheduleHistoryQuerySchema,
  scheduleSummarySchema,
  scheduleWorkerShortageSchema,
  updateMinimumStaffingRuleRequestSchema,
  updateOrganizationRequestSchema,
  updateScheduleAssignmentRequestSchema,
  updateWorkerRequestSchema,
  upsertActiveSchedulePlanningPeriodRequestSchema,
  userSchema,
  workerSchema,
  workersListResponseSchema,
} from "../../schemas";

export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export type User = z.infer<typeof userSchema>;
export type AuthSignupRequest = z.infer<typeof authSignupRequestSchema>;
export type AuthLoginRequest = z.infer<typeof authLoginRequestSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;

export type OrganizationSummary = z.infer<typeof organizationSummarySchema>;
export type OrganizationDetail = z.infer<typeof organizationDetailSchema>;
export type CreateOrganizationRequest = z.infer<typeof createOrganizationRequestSchema>;
export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationRequestSchema>;

export type ActiveSchedulePlanningPeriod = z.infer<typeof activeSchedulePlanningPeriodSchema>;
export type ActiveSchedulePlanningPeriodResponse = z.infer<
  typeof activeSchedulePlanningPeriodResponseSchema
>;
export type UpsertActiveSchedulePlanningPeriodRequest = z.infer<
  typeof upsertActiveSchedulePlanningPeriodRequestSchema
>;

export type Worker = z.infer<typeof workerSchema>;
export type WorkersListResponse = z.infer<typeof workersListResponseSchema>;
export type CreateWorkerRequest = z.infer<typeof createWorkerRequestSchema>;
export type UpdateWorkerRequest = z.infer<typeof updateWorkerRequestSchema>;

export type Availability = z.infer<typeof availabilitySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type AvailabilityListResponse = z.infer<typeof availabilityListResponseSchema>;
export type ReplaceAvailabilityRequest = z.infer<typeof replaceAvailabilityRequestSchema>;

export type MinimumStaffingRule = z.infer<typeof minimumStaffingRuleSchema>;
export type MinimumStaffingRulesListResponse = z.infer<
  typeof minimumStaffingRulesListResponseSchema
>;
export type CreateMinimumStaffingRuleRequest = z.infer<
  typeof createMinimumStaffingRuleRequestSchema
>;
export type UpdateMinimumStaffingRuleRequest = z.infer<
  typeof updateMinimumStaffingRuleRequestSchema
>;

export type ScheduleSummary = z.infer<typeof scheduleSummarySchema>;
export type ScheduleDetail = z.infer<typeof scheduleDetailSchema>;
export type ScheduleAssignment = z.infer<typeof scheduleAssignmentSchema>;
export type ScheduleCandidate = z.infer<typeof scheduleCandidateSchema>;
export type ScheduleWorkerShortage = z.infer<typeof scheduleWorkerShortageSchema>;
export type RecommendScheduleRequest = z.infer<typeof recommendScheduleRequestSchema>;
export type DraftScheduleQuery = z.infer<typeof draftScheduleQuerySchema>;
export type DraftScheduleResponse = z.infer<typeof draftScheduleResponseSchema>;
export type ScheduleAssignmentInput = z.infer<typeof scheduleAssignmentInputSchema>;
export type UpdateScheduleAssignmentRequest = z.infer<typeof updateScheduleAssignmentRequestSchema>;

export type ScheduleHistoryQuery = z.infer<typeof scheduleHistoryQuerySchema>;
export type ScheduleHistoryItem = z.infer<typeof scheduleHistoryItemSchema>;
export type ScheduleHistoryListResponse = z.infer<typeof scheduleHistoryListResponseSchema>;
export type ScheduleHistoryDetailResponse = z.infer<typeof scheduleHistoryDetailResponseSchema>;

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
