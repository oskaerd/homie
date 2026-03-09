// Copy this file to allowed-users.ts and fill in the email addresses of your household members.
// allowed-users.ts is gitignored and will never be committed.
//
//   cp config/allowed-users.template.ts config/allowed-users.ts
//
// The app will refuse to build (and therefore not run) if allowed-users.ts is missing.

export const ALLOWED_EMAILS = [
  'person1@example.com',
  'person2@example.com',
]
