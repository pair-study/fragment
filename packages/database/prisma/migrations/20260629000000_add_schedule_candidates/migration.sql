CREATE TABLE "schedule_candidates" (
    "id" BIGSERIAL NOT NULL,
    "schedule_id" BIGINT NOT NULL,
    "worker_id" BIGINT,
    "work_date" DATE NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "worker_name_snapshot" TEXT NOT NULL,
    "employee_code_snapshot" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_candidates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "schedule_candidates_schedule_id_work_date_idx" ON "schedule_candidates"("schedule_id", "work_date");
CREATE INDEX "schedule_candidates_worker_id_idx" ON "schedule_candidates"("worker_id");
CREATE INDEX "schedule_candidates_starts_at_ends_at_idx" ON "schedule_candidates"("starts_at", "ends_at");

ALTER TABLE "schedule_candidates" ADD CONSTRAINT "schedule_candidates_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_candidates" ADD CONSTRAINT "schedule_candidates_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
