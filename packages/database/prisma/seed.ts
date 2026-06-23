import { hash } from "bcryptjs";

import { createPrismaClient } from "../src/prisma";

const SEED_USER = {
  email: "owner@fragment.local",
  password: "Password123!",
  name: "프래그먼트 관리자",
};

const BUSINESS_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

const prisma = createPrismaClient();

function timeOfDay(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  const passwordHash = await hash(SEED_USER.password, 12);

  const user = await prisma.user.upsert({
    where: { email: SEED_USER.email },
    update: {
      passwordHash,
      name: SEED_USER.name,
    },
    create: {
      email: SEED_USER.email,
      passwordHash,
      name: SEED_USER.name,
    },
  });

  const organization = await prisma.organization.upsert({
    where: { userId: user.id },
    update: {
      name: "프래그먼트 카페",
      lastWorkerSequence: 3,
    },
    create: {
      userId: user.id,
      name: "프래그먼트 카페",
      lastWorkerSequence: 3,
    },
  });

  await Promise.all(
    BUSINESS_DAYS.map((dayOfWeek) =>
      prisma.organizationBusinessHour.upsert({
        where: {
          organizationId_dayOfWeek: {
            organizationId: organization.id,
            dayOfWeek,
          },
        },
        update: {
          isClosed: false,
          openTime: timeOfDay("09:00"),
          closeTime: timeOfDay("22:00"),
          closesNextDay: false,
        },
        create: {
          organizationId: organization.id,
          dayOfWeek,
          isClosed: false,
          openTime: timeOfDay("09:00"),
          closeTime: timeOfDay("22:00"),
          closesNextDay: false,
        },
      }),
    ),
  );

  await prisma.organizationBusinessHour.upsert({
    where: {
      organizationId_dayOfWeek: {
        organizationId: organization.id,
        dayOfWeek: "SUN",
      },
    },
    update: {
      isClosed: true,
      openTime: null,
      closeTime: null,
      closesNextDay: false,
    },
    create: {
      organizationId: organization.id,
      dayOfWeek: "SUN",
      isClosed: true,
      openTime: null,
      closeTime: null,
      closesNextDay: false,
    },
  });

  await Promise.all(
    [
      { employeeCode: "W001", name: "김민지", weeklyContractHours: 20 },
      { employeeCode: "W002", name: "박준호", weeklyContractHours: 24 },
      { employeeCode: "W003", name: "이서연", weeklyContractHours: 16 },
    ].map((worker) =>
      prisma.worker.upsert({
        where: {
          organizationId_employeeCode: {
            organizationId: organization.id,
            employeeCode: worker.employeeCode,
          },
        },
        update: {
          name: worker.name,
          weeklyContractHours: worker.weeklyContractHours,
        },
        create: {
          organizationId: organization.id,
          employeeCode: worker.employeeCode,
          name: worker.name,
          weeklyContractHours: worker.weeklyContractHours,
        },
      }),
    ),
  );

  await prisma.activeSchedulePlanningPeriod.upsert({
    where: { organizationId: organization.id },
    update: {
      startDate: dateOnly("2026-06-22"),
      endDate: dateOnly("2026-07-05"),
    },
    create: {
      organizationId: organization.id,
      startDate: dateOnly("2026-06-22"),
      endDate: dateOnly("2026-07-05"),
    },
  });

  await prisma.minimumStaffingRule.deleteMany({
    where: { organizationId: organization.id },
  });

  await prisma.minimumStaffingRule.createMany({
    data: [
      {
        organizationId: organization.id,
        dayOfWeek: "MON",
        startTime: timeOfDay("09:00"),
        endTime: timeOfDay("18:00"),
        requiredCount: 2,
      },
      {
        organizationId: organization.id,
        dayOfWeek: "FRI",
        startTime: timeOfDay("18:00"),
        endTime: timeOfDay("22:00"),
        requiredCount: 3,
      },
      {
        organizationId: organization.id,
        dayOfWeek: "SAT",
        startTime: timeOfDay("10:00"),
        endTime: timeOfDay("20:00"),
        requiredCount: 3,
      },
    ],
  });

  console.info(`Seed completed: ${SEED_USER.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
