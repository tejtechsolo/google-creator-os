-- Add an explicit purpose so login MFA challenges cannot be reused for step-up operations.

ALTER TABLE "MfaChallenge"
ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'LOGIN';

CREATE INDEX "MfaChallenge_userId_purpose_expiresAt_idx"
ON "MfaChallenge"("userId", "purpose", "expiresAt");
