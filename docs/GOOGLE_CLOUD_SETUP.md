# Google Cloud Configuration Checklist

## APIs

Enable only the APIs needed by your selected modules. The initial product is designed around:

- Gmail
- Drive
- Photos
- YouTube
- Calendar
- Sheets
- Analytics
- Search Console
- Google Ads
- Business Profile
- People/Contacts
- Tasks
- Docs
- Forms

## OAuth

1. Select the Google Cloud project.
2. Configure OAuth consent screen.
3. Add app name and support/developer email.
4. Add authorized domains for production.
5. Add the scopes required by the enabled modules.
6. Create a Web application OAuth client.
7. Add local and production callback URLs.
8. Put client ID/secret in the deployment secret store.

Google's web-server OAuth flow uses an authorization code which the server exchanges for access/refresh tokens. Keep these tokens server-side.

## Testing

Use a Google test user while the OAuth application is in testing mode. If a requested scope requires verification, complete Google's verification requirements before opening the app to general users.

## Ads

Google Ads requires:

- Google Cloud project
- Google Ads API enabled
- OAuth credentials
- `https://www.googleapis.com/auth/adwords` scope when using user authentication
- Developer token
- Customer ID
- Manager/login customer ID when the target account is accessed through a manager account

Do not put a service-account JSON key in the repository. If service-account authentication is used for a dedicated Ads setup, store the key in a managed secret store.

## Production

Update the redirect URI from localhost to the HTTPS application domain. OAuth client configuration and application environment variables must match exactly.
