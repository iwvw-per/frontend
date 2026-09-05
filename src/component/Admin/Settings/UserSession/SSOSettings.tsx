import { ExpandMoreRounded } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  Box,
  Button,
  FormControlLabel,
  Stack,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import MuiAccordionSummary, { AccordionSummaryProps } from "@mui/material/AccordionSummary";
import { LoadingButton } from "@mui/lab";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "../../../../redux/hooks.ts";
import { StyledCheckbox } from "../../../Common/StyledComponents.tsx";
import { loadSSOSettings, parseConfig, saveSSOSettings, serializeConfig, OIDCConfig } from "../../../../api/proSSO.ts";
import { LogtoConfig, QQConnectConfig } from "../../../../api/dashboard.ts";

export const AccordionSummary = styled((props: AccordionSummaryProps) => <MuiAccordionSummary {...props} />)(
  ({ theme }) => ({
    fontSize: theme.typography.body2.fontSize,
    paddingLeft: theme.spacing(4),
    "& .MuiFormControlLabel-label": {
      fontSize: theme.typography.body2.fontSize,
    },
    "& .MuiCheckbox-root": {
      marginRight: theme.spacing(2),
    },
  }),
);

export const StyledAccordion = styled(Accordion)(({ theme }) => ({
  boxShadow: "none",
  border: `1px solid ${theme.palette.divider}`,
  "&::before": {
    display: "none",
  },
}));

const configFieldProps = {
  fullWidth: true,
  size: "small" as const,
  margin: "dense" as const,
};

const SSOSettings = () => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();

  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    dispatch(loadSSOSettings())
      .then((res) => {
        setValues((res ?? {}) as Record<string, string>);
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const patch = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const setEnabled = (enabledKey: string, checked: boolean) => {
    patch(enabledKey, checked ? "1" : "0");
  };

  const patchOIDCConfig = (configKey: string, config: OIDCConfig) => {
    patch(configKey, serializeConfig(config));
  };

  const patchQQConfig = (configKey: string, config: QQConnectConfig) => {
    patch(configKey, serializeConfig(config));
  };

  const submit = () => {
    setSaving(true);
    dispatch(saveSSOSettings(values))
      .then((res) => {
        setValues((res ?? {}) as Record<string, string>);
      })
      .finally(() => setSaving(false));
  };

  const logtoEnabled = values["logto_enabled"] === "1";
  const oidcEnabled = values["oidc_enabled"] === "1";
  const qqEnabled = values["qq_login"] === "1";

  const logtoConfig = parseConfig<LogtoConfig>(values["logto_config"], {});
  const oidcConfig = parseConfig<OIDCConfig>(values["oidc_config"], {});
  const qqConfig = parseConfig<QQConnectConfig>(values["qq_login_config"], {});

  if (loading) {
    return (
      <Typography variant={"body2"} color={"text.secondary"}>
        Loading...
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <StyledAccordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRounded />}>
          <FormControlLabel
            control={
              <StyledCheckbox
                size={"small"}
                checked={qqEnabled}
                onChange={(e) => setEnabled("qq_login", e.target.checked)}
              />
            }
            label={t("vas.qqConnect")}
          />
        </AccordionSummary>
        <AccordionDetails sx={{ display: "block" }}>
          <Stack spacing={1}>
            <TextField
              {...configFieldProps}
              label={"App ID"}
              value={qqConfig.app_id ?? ""}
              onChange={(e) => patchQQConfig("qq_login_config", { ...qqConfig, app_id: e.target.value })}
            />
            <TextField
              {...configFieldProps}
              label={"App Secret"}
              type={"password"}
              value={qqConfig.app_secret ?? ""}
              onChange={(e) => patchQQConfig("qq_login_config", { ...qqConfig, app_secret: e.target.value })}
            />
          </Stack>
        </AccordionDetails>
      </StyledAccordion>

      <StyledAccordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRounded />}>
          <FormControlLabel
            control={
              <StyledCheckbox
                size={"small"}
                checked={logtoEnabled}
                onChange={(e) => setEnabled("logto_enabled", e.target.checked)}
              />
            }
            label={t("settings.logto")}
          />
        </AccordionSummary>
        <AccordionDetails sx={{ display: "block" }}>
          <Stack spacing={1}>
            <TextField
              {...configFieldProps}
              label={"Endpoint"}
              value={logtoConfig.endpoint ?? ""}
              onChange={(e) => patchOIDCConfig("logto_config", { ...logtoConfig, endpoint: e.target.value })}
            />
            <TextField
              {...configFieldProps}
              label={"App ID"}
              value={logtoConfig.app_id ?? ""}
              onChange={(e) => patchOIDCConfig("logto_config", { ...logtoConfig, app_id: e.target.value })}
            />
            <TextField
              {...configFieldProps}
              label={"App Secret"}
              type={"password"}
              value={logtoConfig.app_secret ?? ""}
              onChange={(e) => patchOIDCConfig("logto_config", { ...logtoConfig, app_secret: e.target.value })}
            />
            <TextField
              {...configFieldProps}
              label={"Display Name"}
              value={logtoConfig.display_name ?? ""}
              onChange={(e) => patchOIDCConfig("logto_config", { ...logtoConfig, display_name: e.target.value })}
            />
            <FormControlLabel
              control={
                <StyledCheckbox
                  size={"small"}
                  checked={logtoConfig.direct_sign_in ?? false}
                  onChange={(e) =>
                    patchOIDCConfig("logto_config", { ...logtoConfig, direct_sign_in: e.target.checked })
                  }
                />
              }
              label={"Direct Sign In"}
            />
          </Stack>
        </AccordionDetails>
      </StyledAccordion>

      <StyledAccordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRounded />}>
          <FormControlLabel
            control={
              <StyledCheckbox
                size={"small"}
                checked={oidcEnabled}
                onChange={(e) => setEnabled("oidc_enabled", e.target.checked)}
              />
            }
            label={t("settings.oidc")}
          />
        </AccordionSummary>
        <AccordionDetails sx={{ display: "block" }}>
          <Stack spacing={1}>
            <TextField
              {...configFieldProps}
              label={"Endpoint"}
              value={oidcConfig.endpoint ?? ""}
              onChange={(e) => patchOIDCConfig("oidc_config", { ...oidcConfig, endpoint: e.target.value })}
            />
            <TextField
              {...configFieldProps}
              label={"App ID"}
              value={oidcConfig.app_id ?? ""}
              onChange={(e) => patchOIDCConfig("oidc_config", { ...oidcConfig, app_id: e.target.value })}
            />
            <TextField
              {...configFieldProps}
              label={"App Secret"}
              type={"password"}
              value={oidcConfig.app_secret ?? ""}
              onChange={(e) => patchOIDCConfig("oidc_config", { ...oidcConfig, app_secret: e.target.value })}
            />
            <TextField
              {...configFieldProps}
              label={"Scope"}
              value={oidcConfig.scope ?? ""}
              onChange={(e) => patchOIDCConfig("oidc_config", { ...oidcConfig, scope: e.target.value })}
            />
          </Stack>
        </AccordionDetails>
      </StyledAccordion>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <LoadingButton loading={saving} variant={"contained"} onClick={submit}>
          {t("settings.save")}
        </LoadingButton>
      </Box>
    </Stack>
  );
};

export default SSOSettings;
