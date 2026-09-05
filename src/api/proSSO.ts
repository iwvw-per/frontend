import { getSettings, sendSetSetting } from "./api.ts";
import { LogtoConfig, QQConnectConfig } from "./dashboard.ts";

export type SSOProvider = "logto" | "oidc" | "qq";

/**
 * OpenID config for the Logto / generic OIDC providers. Kept in sync with the
 * backend `ssoConfig` struct in `service/auth`.
 */
export interface OIDCConfig {
  endpoint?: string;
  app_id?: string;
  app_secret?: string;
  direct_sign_in?: boolean;
  display_name?: string;
  scope?: string;
}

/** Setting keys owned by the PRO SSO feature. */
export const ssoSettingKeys: string[] = [
  "logto_enabled",
  "logto_config",
  "oidc_enabled",
  "oidc_config",
  "qq_login",
  "qq_login_config",
];

/** Build the SSO start (authorize) URL for a provider. */
export function buildSSOStartURL(provider: SSOProvider): string {
  return `/api/v4/session/sso/${provider}/start`;
}

/** Build the SSO callback URL for a provider. */
export function buildSSOCallbackURL(provider: SSOProvider): string {
  return `/api/v4/session/sso/${provider}/callback`;
}

/** Dispatchable thunk: fetch all PRO SSO settings. */
export function loadSSOSettings() {
  return getSettings({ keys: ssoSettingKeys });
}

/** Dispatchable thunk: persist a partial map of PRO SSO settings. */
export function saveSSOSettings(settings: Record<string, string>) {
  return sendSetSetting({ settings });
}

/**
 * Parse a raw JSON settings value into a typed config object.
 * Falls back to an empty object when the value is missing or invalid.
 */
export function parseConfig<T>(raw: string | undefined, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Serialize a typed config object back to a JSON settings string. */
export function serializeConfig(config: object): string {
  return JSON.stringify(config);
}

/**
 * Extract the display name used for the SSO button. Defaults to a sensible
 * label when the provider has not configured one.
 */
export function providerDisplayName(provider: SSOProvider, cfg: LogtoConfig | OIDCConfig | QQConnectConfig): string {
  const configured = (cfg as LogtoConfig).display_name;
  if (configured) {
    return configured;
  }
  switch (provider) {
    case "logto":
      return "Logto";
    case "oidc":
      return "OIDC";
    case "qq":
      return "QQ";
  }
}
