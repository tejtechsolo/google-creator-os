export const GOOGLE_SCOPES = {
  gmail: ["https://www.googleapis.com/auth/gmail.modify"],
  drive: ["https://www.googleapis.com/auth/drive"],
  photos: ["https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata"],
  youtube: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/youtube.upload"],
  calendar: ["https://www.googleapis.com/auth/calendar"],
  sheets: ["https://www.googleapis.com/auth/spreadsheets"],
  analytics: ["https://www.googleapis.com/auth/analytics.readonly"],
  searchConsole: ["https://www.googleapis.com/auth/webmasters.readonly"],
  ads: ["https://www.googleapis.com/auth/adwords"]
} as const;

export function scopesFor(services: string[]) {
  return [...new Set(services.flatMap((service) => GOOGLE_SCOPES[service as keyof typeof GOOGLE_SCOPES] ?? []))];
}
