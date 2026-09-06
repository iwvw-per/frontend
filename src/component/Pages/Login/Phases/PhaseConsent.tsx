import { Description } from "@mui/icons-material";
import {
  alpha,
  Box,
  Checkbox,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import { AppRegistration } from "../../../../api/user.ts";
import SessionManager from "../../../../session";
import CloudOff from "../../../Icons/CloudOff.tsx";
import CubeSync from "../../../Icons/CubeSync.tsx";
import Currency from "../../../Icons/Currency.tsx";
import FolderOutlined from "../../../Icons/FolderOutlined.tsx";
import LockClosedOutlined from "../../../Icons/LockClosedOutlined.tsx";
import PersonOutlined from "../../../Icons/PersonOutlined.tsx";
import PhoneLaptopOutlined from "../../../Icons/PhoneLaptopOutlined.tsx";
import ShareOutlined from "../../../Icons/ShareOutlined.tsx";
import WrenchSettings from "../../../Icons/WrenchSettings.tsx";
import { Control } from "../Signin/SignIn.tsx";

// Scope definitions with icons and category information
interface ScopeInfo {
  name: string;
  description: string;
  icon: React.ElementType;
  category: "profile" | "files" | "security" | "admin" | "other";
}

const scopeDefinitions: Record<string, ScopeInfo> = {
  // Profile scopes (profile, email, UserInfo all use the same description)
  profile: {
    name: "oauth.scope.profile",
    description: "oauth.scope.profileDesc",
    icon: PersonOutlined,
    category: "profile",
  },
  email: {
    name: "oauth.scope.profile",
    description: "oauth.scope.profileDesc",
    icon: PersonOutlined,
    category: "profile",
  },
  "UserInfo.Read": {
    name: "oauth.scope.profile",
    description: "oauth.scope.profileDesc",
    icon: PersonOutlined,
    category: "profile",
  },

  // Offline access
  offline_access: {
    name: "oauth.scope.offlineAccess",
    description: "oauth.scope.offlineAccessDesc",
    icon: CloudOff,
    category: "other",
  },

  // Security scopes
  "UserSecurityInfo.Read": {
    name: "oauth.scope.userSecurityInfo",
    description: "oauth.scope.userSecurityInfoDesc",
    icon: LockClosedOutlined,
    category: "security",
  },

  // Workflow scopes
  "Workflow.Read": {
    name: "navbar.taskQueue",
    description: "oauth.scope.workflowDesc",
    icon: CubeSync,
    category: "other",
  },

  // Admin scopes
  "Admin.Read": {
    name: "oauth.scope.admin",
    description: "oauth.scope.adminDesc",
    icon: WrenchSettings,
    category: "admin",
  },

  // File scopes
  "Files.Read": {
    name: "oauth.scope.files",
    description: "oauth.scope.filesDesc",
    icon: FolderOutlined,
    category: "files",
  },

  // Share scopes
  "Shares.Read": {
    name: "oauth.scope.shares",
    description: "oauth.scope.sharesDesc",
    icon: ShareOutlined,
    category: "files",
  },

  // Finance scopes
  "Finance.Read": {
    name: "setting.finance",
    description: "oauth.scope.financeDesc",
    icon: Currency,
    category: "other",
  },

  // WebDAV scopes
  "DavAccount.Read": {
    name: "oauth.scope.davAccount",
    description: "oauth.scope.davAccountDesc",
    icon: PhoneLaptopOutlined,
    category: "security",
  },
};

// Hidden scopes that should not be displayed
const hiddenScopes = ["openid"];

// Profile-related scopes that should be merged into one
const profileScopes = ["profile", "email", "UserInfo.Read", "UserInfo.Write"];

// Merge Read/Write scopes and profile scopes for display
const getMergedScopes = (scopes: string[]): { scope: string; accessLevel: "readonly" | "readwrite" | null }[] => {
  const result: { scope: string; accessLevel: "readonly" | "readwrite" | null }[] = [];
  const processed = new Set<string>();

  // Check if any profile scope exists and add it first
  const hasProfileScope = scopes.some((s) => profileScopes.includes(s));
  if (hasProfileScope) {
    // Check if UserInfo.Write exists to determine access level
    const hasUserInfoWrite = scopes.includes("UserInfo.Write");
    const hasUserInfoRead = scopes.includes("UserInfo.Read");
    let accessLevel: "readonly" | "readwrite" | null = null;
    if (hasUserInfoRead || hasUserInfoWrite) {
      accessLevel = hasUserInfoWrite ? "readwrite" : "readonly";
    }
    result.push({ scope: "profile", accessLevel });
    profileScopes.forEach((s) => processed.add(s));
  }

  for (const scope of scopes) {
    if (hiddenScopes.includes(scope) || processed.has(scope)) continue;

    if (scope.endsWith(".Write")) {
      const readScope = scope.replace(".Write", ".Read");
      processed.add(scope);
      processed.add(readScope);
      result.push({ scope: readScope, accessLevel: "readwrite" });
    } else if (scope.endsWith(".Read")) {
      const writeScope = scope.replace(".Read", ".Write");
      if (!scopes.includes(writeScope)) {
        processed.add(scope);
        result.push({ scope, accessLevel: "readonly" });
      }
      // If Write scope exists, it will be processed when we encounter it
    } else {
      processed.add(scope);
      result.push({ scope, accessLevel: null });
    }
  }

  return result;
};

interface ScopeListProps {
  requestedScopes: string[];
  selectedScopes: string[];
  onScopeToggle: (scope: string) => void;
}

// 计算合并展示项对应的原始 scope 集合（如 "Files.Read" readwrite 对应 Files.Read+Files.Write）
const mergedScopeToRawScopes = (merged: { scope: string; accessLevel: "readonly" | "readwrite" | null }): string[] => {
  if (merged.accessLevel === "readwrite") {
    return [merged.scope, merged.scope.replace(".Read", ".Write")];
  }
  if (merged.scope === "profile") {
    return profileScopes.filter((s) => s !== "UserInfo.Write");
  }
  return [merged.scope];
};

const ScopeList = ({ requestedScopes, selectedScopes, onScopeToggle }: ScopeListProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const mergedScopes = getMergedScopes(requestedScopes);

  return (
    <List dense sx={{ py: 0 }}>
      {mergedScopes.map(({ scope, accessLevel }) => {
        const scopeInfo = scopeDefinitions[scope];
        const Icon = scopeInfo?.icon || Description;
        const rawScopes = mergedScopeToRawScopes({ scope, accessLevel });
        const checked = rawScopes.every((s) => selectedScopes.includes(s));
        const indeterminate = !checked && rawScopes.some((s) => selectedScopes.includes(s));

        return (
          <ListItem
            key={scope}
            disablePadding
            sx={{ py: 0.5 }}
            secondaryAction={
              <Checkbox
                size="small"
                checked={checked}
                indeterminate={indeterminate}
                onChange={() => rawScopes.forEach((s) => onScopeToggle(s))}
              />
            }
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Icon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>{scopeInfo ? t(scopeInfo.name, { defaultValue: scope }) : scope}</span>
                  {accessLevel && (
                    <Chip
                      label={t(accessLevel === "readonly" ? "oauth.scope.readonly" : "oauth.scope.readwrite")}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.7rem",
                        backgroundColor:
                          accessLevel === "readonly"
                            ? alpha(theme.palette.info.main, 0.1)
                            : alpha(theme.palette.warning.main, 0.1),
                        color: accessLevel === "readonly" ? theme.palette.info.main : theme.palette.warning.main,
                      }}
                    />
                  )}
                </Box>
              }
              secondary={scopeInfo?.description ? t(scopeInfo.description) : undefined}
              slotProps={{
                primary: { variant: "body2" },
                secondary: { variant: "caption" },
              }}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export interface PhaseConsentProps {
  app: AppRegistration;
  requestedScopes: string[];
  selectedScopes: string[];
  onScopeToggle: (scope: string) => void;
  control: Control;
}

const PhaseConsent = ({ app, requestedScopes, selectedScopes, onScopeToggle, control }: PhaseConsentProps) => {
  const { t } = useTranslation();
  const currentUser = SessionManager.currentUser();

  // Filter out hidden scopes for display
  const displayScopes = requestedScopes.filter((s) => !hiddenScopes.includes(s));

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <Trans
          i18nKey="oauth.consentDescription"
          components={[<strong key={0} />, <strong key={1} />]}
          values={{
            appName: t(app.name),
            userEmail: currentUser?.email || currentUser?.nickname || "",
          }}
        />
      </Typography>
      <ScopeList requestedScopes={displayScopes} selectedScopes={selectedScopes} onScopeToggle={onScopeToggle} />
      {control.submit}
      {control.back}
    </Box>
  );
};

export default PhaseConsent;
