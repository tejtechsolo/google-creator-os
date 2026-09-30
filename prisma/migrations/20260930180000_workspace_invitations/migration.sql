CREATE TABLE "WorkspaceInvitation" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "invitedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceInvitation_tokenHash_key" ON "WorkspaceInvitation"("tokenHash");
CREATE INDEX "WorkspaceInvitation_workspaceId_email_idx" ON "WorkspaceInvitation"("workspaceId", "email");
CREATE INDEX "WorkspaceInvitation_email_expiresAt_idx" ON "WorkspaceInvitation"("email", "expiresAt");
CREATE INDEX "WorkspaceInvitation_workspaceId_acceptedAt_idx" ON "WorkspaceInvitation"("workspaceId", "acceptedAt");

ALTER TABLE "WorkspaceInvitation"
  ADD CONSTRAINT "WorkspaceInvitation_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceInvitation"
  ADD CONSTRAINT "WorkspaceInvitation_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
