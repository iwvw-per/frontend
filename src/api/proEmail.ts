import { getSettings, sendSetSetting } from "./api.ts";

/** Provider values for the email domain filter. Kept in sync with the backend
 * `filter_email_provider` setting and the index order of
 * `filterEmailProviderDisabled/Whitelist/Blacklist`. */
export const filterEmailProviderDisabled = "0";
export const filterEmailProviderWhitelist = "1";
export const filterEmailProviderBlacklist = "2";

/** Setting keys owned by the PRO email domain filter feature. */
export const emailFilterSettingKeys: string[] = [
  "filter_email_provider",
  "filter_email_provider_rules",
  "disable_sub_address_email",
];

export interface EmailFilterConfig {
  provider: string;
  rules: string[];
}

/** Dispatchable thunk: fetch all email domain filter settings. */
export function loadEmailFilterSettings() {
  return getSettings({ keys: emailFilterSettingKeys });
}

/** Dispatchable thunk: persist a partial map of email domain filter settings. */
export function saveEmailFilterSettings(settings: Record<string, string>) {
  return sendSetSetting({ settings });
}

/** Parse a comma-separated domain list into normalized rule strings. */
export function parseEmailFilterRules(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter((r) => r.length > 0);
}

/**
 * Decide whether an email passes the configured domain filter.
 * provider: "0" disabled / "1" whitelist / "2" blacklist.
 */
export function isEmailAllowedByFilter(email: string, provider: string, rules: string[]): boolean {
  if (provider === filterEmailProviderWhitelist || provider === filterEmailProviderBlacklist) {
    const at = email.lastIndexOf("@");
    const domain = (at >= 0 ? email.slice(at + 1) : email).toLowerCase();
    const blocked = rules.includes(domain);
    if (provider === filterEmailProviderWhitelist) {
      return blocked;
    }
    return !blocked;
  }
  return true;
}

/** Normalize the raw email filter config for display. */
export function toEmailFilterConfig(raw: Record<string, string | undefined> | undefined): EmailFilterConfig {
  const provider = raw?.["filter_email_provider"] ?? filterEmailProviderDisabled;
  const rules = parseEmailFilterRules(raw?.["filter_email_provider_rules"]);
  return { provider, rules };
}
