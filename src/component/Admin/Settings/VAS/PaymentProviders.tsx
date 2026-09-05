import { Chip, Stack, Table, TableBody, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { NoWrapCell, StyledTableContainerPaper } from "../../../Common/StyledComponents";

export interface PaymentProviderProps {
  config?: Record<string, any>;
}

interface PaymentProviderDef {
  key: string;
  labelKey: string;
}

const providers: PaymentProviderDef[] = [
  { key: "alipay", labelKey: "settings.alipayProvider" },
  { key: "wechat", labelKey: "vas.wechatPay" },
  { key: "payjs", labelKey: "vas.payjs" },
  { key: "custom", labelKey: "settings.customProvider" },
];

const getEnabled = (config: Record<string, any> | undefined, key: string): boolean | undefined => {
  if (!config) return undefined;
  const v = config[key];
  if (v == null) return undefined;
  if (typeof v === "object") return !!v.enabled;
  return v === true || v === "1" || v === 1 || v === "true";
};

const PaymentProviders: React.FC<PaymentProviderProps> = ({ config }) => {
  const { t } = useTranslation("dashboard");
  const entries = providers
    .map((p) => ({ ...p, enabled: getEnabled(config, p.key) }))
    .filter((p) => p.enabled !== undefined);

  if (entries.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography variant="caption" color="text.secondary">
          {t("application:setting.listEmpty")}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <TableContainer component={StyledTableContainerPaper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <NoWrapCell>{t("payment.providerID")}</NoWrapCell>
              <NoWrapCell>{t("vas.status")}</NoWrapCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((p) => (
              <TableRow key={p.key}>
                <NoWrapCell>{t(p.labelKey)}</NoWrapCell>
                <NoWrapCell>
                  <Chip
                    size="small"
                    color={p.enabled ? "success" : "default"}
                    label={p.enabled ? t("vas.enable") : t("vas.no")}
                  />
                </NoWrapCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default PaymentProviders;
