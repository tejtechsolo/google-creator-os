export const GOOGLE_SCOPES = {
  gmail: ["https://www.googleapis.com/auth/gmail.modify"],
  drive: ["https://www.googleapis.com/auth/drive"],
  photos: ["https://www.googleapis.com/auth/photoslibrary.readonly"],
  youtube: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/youtube.upload"],
  calendar: ["https://www.googleapis.com/auth/calendar"],
  sheets: ["https://www.googleapis.com/auth/spreadsheets"],
  analytics: ["https://www.googleapis.com/auth/analytics.readonly"],
  searchConsole: ["https://www.googleapis.com/auth/webmasters.readonly"],
  search_console: ["https://www.googleapis.com/auth/webmasters.readonly"],
  ads: ["https://www.googleapis.com/auth/adwords"],
  contacts: ["https://www.googleapis.com/auth/contacts.readonly"],
  tasks: ["https://www.googleapis.com/auth/tasks"],
  docs: ["https://www.googleapis.com/auth/documents"],
  forms: ["https://www.googleapis.com/auth/forms.body.readonly"],
} as const;

export function scopesFor(services: string[]) {
  return [...new Set(services.flatMap((service) => {
    const key = service.trim();
    return GOOGLE_SCOPES[key as keyof typeof GOOGLE_SCOPES] ?? [];
  }))];
}
