import { Button, Divider, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { buildSSOStartURL } from "../../../../api/proSSO.ts";
import { SiteConfig } from "../../../../api/site.ts";
import { PrepareLoginResponse } from "../../../../api/user.ts";
import { useAppSelector } from "../../../../redux/hooks.ts";
import LockClosed from "../../../Icons/LockClosed.tsx";
import QQ from "../../../Icons/QQ.tsx";

export interface SSOLoginButtonsProps {
  loginOptions?: PrepareLoginResponse;
}

type LoginSSOSiteConfig = SiteConfig & {
  sso_enabled?: boolean;
  qq_enabled?: boolean;
};

const SSOLoginButtons = ({ loginOptions }: SSOLoginButtonsProps) => {
  const { t } = useTranslation();
  const siteLoginConfig = useAppSelector((state) => state.siteConfig.login.config) as LoginSSOSiteConfig;

  const ssoEnabled = !!loginOptions?.sso_enabled || !!siteLoginConfig.sso_enabled;
  const qqEnabled = !!loginOptions?.qq_enabled || !!siteLoginConfig.qq_enabled;

  if (!ssoEnabled && !qqEnabled) {
    return null;
  }

  const startSSO = (provider: "logto" | "qq") => {
    window.location.href = buildSSOStartURL(provider);
  };

  return (
    <>
      <Divider sx={{ my: 2 }} role="presentation">
        <Typography variant="body2" color={"text.secondary"}>
          {t("login.thirdPartyLogin")}
        </Typography>
      </Divider>
      <Stack spacing={1}>
        {qqEnabled && (
          <Button fullWidth variant="outlined" startIcon={<QQ />} onClick={() => startSSO("qq")}>
            {t("login.qqLogin")}
          </Button>
        )}
        {ssoEnabled && (
          <Button fullWidth variant="outlined" startIcon={<LockClosed />} onClick={() => startSSO("logto")}>
            {t("login.ssoLogin")}
          </Button>
        )}
      </Stack>
    </>
  );
};

export default SSOLoginButtons;
