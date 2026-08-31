CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE');
CREATE TYPE "IntegrationService" AS ENUM ('GMAIL','DRIVE','PHOTOS','YOUTUBE','ADS','CALENDAR','SHEETS','ANALYTICS','SEARCH_CONSOLE','BUSINESS_PROFILE','CONTACTS','TASKS','DOCS','FORMS');
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED','DISCONNECTED','ERROR','REAUTH_REQUIRED');
CREATE TYPE "AutomationStatus" AS ENUM ('DRAFT','ACTIVE','PAUSED','ERROR');
CREATE TYPE "RunStatus" AS ENUM ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId","expiresAt");

CREATE TABLE "Integration" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "service" "IntegrationService" NOT NULL,
  "status" "IntegrationStatus" NOT NULL DEFAULT 'CONNECTED',
  "googleAccountId" TEXT,
  "googleEmail" TEXT,
  "scopes" TEXT[] NOT NULL,
  "accessTokenEnc" TEXT,
  "refreshTokenEnc" TEXT,
  "accessTokenExpires" TIMESTAMP(3),
  "metadata" JSONB,
  "lastSyncAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Integration_userId_provider_service_key" ON "Integration"("userId","provider","service");
CREATE INDEX "Integration_userId_idx" ON "Integration"("userId");

CREATE TABLE "Automation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "trigger" JSONB NOT NULL,
  "actions" JSONB NOT NULL,
  "status" "AutomationStatus" NOT NULL DEFAULT 'DRAFT',
  "schedule" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Automation_userId_status_idx" ON "Automation"("userId","status");

CREATE TABLE "AutomationRun" (
  "id" TEXT NOT NULL,
  "automationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
  "triggerData" JSONB,
  "result" JSONB,
  "error" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AutomationRun_automationId_createdAt_idx" ON "AutomationRun"("automationId","createdAt");
CREATE INDEX "AutomationRun_userId_createdAt_idx" ON "AutomationRun"("userId","createdAt");

CREATE TABLE "Job" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "runAfter" TIMESTAMP(3),
  "lockedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Job_status_runAfter_idx" ON "Job"("status","runAfter");

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "service" TEXT,
  "resourceId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId","createdAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
