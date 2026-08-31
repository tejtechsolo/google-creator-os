import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/google/token-crypto";
import type { IntegrationService } from "@prisma/client";
import { createGoogleOAuthClient } from "@/lib/google/oauth";

export const SERVICE_META: Record<string, { label: string; description: string }> = {
  GMAIL: { label: "Gmail", description: "Email, threads, labels and attachments" },
  DRIVE: { label: "Drive", description: "Files, folders and content storage" },
  PHOTOS: { label: "Photos", description: "Photo-library access for creator workflows" },
  YOUTUBE: { label: "YouTube", description: "Channels, videos and publishing" },
  ADS: { label: "Google Ads", description: "Campaigns, ads and performance" },
  CALENDAR: { label: "Calendar", description: "Events and scheduling" },
  SHEETS: { label: "Sheets", description: "Operational tables and reports" },
  ANALYTICS: { label: "Analytics", description: "Website and content analytics" },
  SEARCH_CONSOLE: { label: "Search Console", description: "Search visibility and queries" },
  BUSINESS_PROFILE: { label: "Business Profile", description: "Business listings and performance" },
  CONTACTS: { label: "Contacts", description: "People and customer contacts" },
  TASKS: { label: "Tasks", description: "Tasks and follow-ups" },
  DOCS: { label: "Docs", description: "Documents and generated content" },
  FORMS: { label: "Forms", description: "Forms and response workflows" },
};

export async function getGoogleClient(userId: string, service: IntegrationService) {
  const integration = await db.integration.findUnique({
    where: { userId_provider_service: { userId, provider: "GOOGLE", service } },
  });
  if (!integration || !integration.refreshTokenEnc) {
    throw new Error(`${service} is not connected`);
  }

  const oauth = createGoogleOAuthClient();
  oauth.setCredentials({
    access_token: integration.accessTokenEnc ? decryptToken(integration.accessTokenEnc) : undefined,
    refresh_token: decryptToken(integration.refreshTokenEnc),
    expiry_date: integration.accessTokenExpires?.getTime(),
  });

  oauth.on("tokens", async (tokens) => {
    try {
      await db.integration.update({
        where: { id: integration.id },
        data: {
          ...(tokens.access_token ? { accessTokenEnc: encryptToken(tokens.access_token) } : {}),
          ...(tokens.expiry_date ? { accessTokenExpires: new Date(tokens.expiry_date) } : {}),
          status: "CONNECTED",
          lastError: null,
        },
      });
    } catch {
      // Token refresh succeeded; persistence failure is recorded by the next request.
    }
  });

  return oauth;
}

export async function gmailClient(userId: string) {
  return google.gmail({ version: "v1", auth: await getGoogleClient(userId, "GMAIL") });
}

export async function driveClient(userId: string) {
  return google.drive({ version: "v3", auth: await getGoogleClient(userId, "DRIVE") });
}

export async function youtubeClient(userId: string) {
  return google.youtube({ version: "v3", auth: await getGoogleClient(userId, "YOUTUBE") });
}

export async function calendarClient(userId: string) {
  return google.calendar({ version: "v3", auth: await getGoogleClient(userId, "CALENDAR") });
}

export async function sheetsClient(userId: string) {
  return google.sheets({ version: "v4", auth: await getGoogleClient(userId, "SHEETS") });
}
