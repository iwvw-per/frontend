import { Box, FormControl, FormControlLabel, ListItemText, Link, Stack, Switch, Typography } from "@mui/material";
import { useContext, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { DenseFilledTextField, DenseSelect } from "../../../Common/StyledComponents.tsx";
import { SquareMenuItem } from "../../../FileManager/ContextMenu/ContextMenu.tsx";
import SettingForm from "../../../Pages/Setting/SettingForm.tsx";
import { NoMarginHelperText, SettingSection, SettingSectionContent } from "../Settings.tsx";
import { SettingContext } from "../SettingWrapper.tsx";
import GiftCodes from "./GiftCodes.tsx";
import GroupProducts from "./GroupProducts.tsx";
import PaymentProviders from "./PaymentProviders.tsx";
import StorageProducts from "./StorageProducts.tsx";

const VAS = () => {
  const { t } = useTranslation("dashboard");
  const { formRef, setSettings, values } = useContext(SettingContext);

  const paymentConfig = useMemo(() => {
    try {
      return JSON.parse(values.payment || "{}");
    } catch {
      return {};
    }
  }, [values.payment]);
  const storageProducts = useMemo(() => values.storage_products || "[]", [values.storage_products]);
  const groupSellData = useMemo(() => values.group_sell_data || "[]", [values.group_sell_data]);

  const boolValue = (key: string): boolean => {
    const v = values[key];
    return v === "1" || v === "true";
  };

  const patchSetting = (key: string, value: string) => {
    setSettings({ [key]: value });
  };

  const onSelectCurrency = (code: string, symbol: string, unit: number) => {
    patchSetting("currency_code", code);
    patchSetting("currency_symbol", symbol);
    patchSetting("currency_unit", unit.toString());
  };

  return (
    <Box component={"form"} ref={formRef}>
      <Stack spacing={5}>
        <SettingSection>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
            {t("settings.creditAndVAS")}
          </Typography>
          <SettingSectionContent>
            <SettingForm lgWidth={5}>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={boolValue("enable_credit")}
                      onChange={(e) => patchSetting("enable_credit", e.target.checked ? "1" : "0")}
                    />
                  }
                  label={t("settings.enableCredit")}
                />
                <NoMarginHelperText>{t("settings.enableCreditDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <Stack spacing={2}>
              <SettingForm title={t("settings.creditPrice")} lgWidth={5}>
                <FormControl fullWidth>
                  <DenseFilledTextField
                    type="number"
                    value={values.credit_price ?? ""}
                    onChange={(e) => patchSetting("credit_price", e.target.value)}
                  />
                  <NoMarginHelperText>{t("settings.creditPriceDes")}</NoMarginHelperText>
                </FormControl>
              </SettingForm>

              <SettingForm title={t("settings.shareScoreRate")} lgWidth={5}>
                <FormControl fullWidth>
                  <DenseFilledTextField
                    type="number"
                    value={values.share_score_rate ?? ""}
                    onChange={(e) => patchSetting("share_score_rate", e.target.value)}
                  />
                  <NoMarginHelperText>{t("settings.shareScoreRateDes")}</NoMarginHelperText>
                </FormControl>
              </SettingForm>
            </Stack>

            <SettingForm title={t("vas.banBufferPeriod")} lgWidth={5}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  type="number"
                  value={values.ban_buffer_period ?? ""}
                  onChange={(e) => patchSetting("ban_buffer_period", e.target.value)}
                />
                <NoMarginHelperText>{t("vas.banBufferPeriodDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <SettingForm title={t("settings.cronNotifyUser")} lgWidth={5}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.cron_notify_user ?? ""}
                  onChange={(e) => patchSetting("cron_notify_user", e.target.value)}
                />
                <NoMarginHelperText>
                  <Trans
                    i18nKey="settings.cronDes"
                    values={{
                      des: t("settings.cronNotifyUserDes"),
                    }}
                    ns={"dashboard"}
                    components={[<Link href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" />]}
                  />
                </NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <SettingForm title={t("settings.cronBanUser")} lgWidth={5}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.cron_ban_user ?? ""}
                  onChange={(e) => patchSetting("cron_ban_user", e.target.value)}
                />
                <NoMarginHelperText>
                  <Trans
                    i18nKey="settings.cronDes"
                    values={{
                      des: t("settings.cronBanUserDes"),
                    }}
                    ns={"dashboard"}
                    components={[<Link href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" />]}
                  />
                </NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <SettingForm lgWidth={5}>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={boolValue("anonymous_purchase")}
                      onChange={(e) => patchSetting("anonymous_purchase", e.target.checked ? "1" : "0")}
                    />
                  }
                  label={t("settings.anonymousPurchase")}
                />
                <NoMarginHelperText>{t("settings.anonymousPurchaseDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <SettingForm lgWidth={5}>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={boolValue("shop_nav_enabled")}
                      onChange={(e) => patchSetting("shop_nav_enabled", e.target.checked ? "1" : "0")}
                    />
                  }
                  label={t("settings.shopNavEnabled")}
                />
                <NoMarginHelperText>{t("settings.shopNavEnabledDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

        <SettingSection>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
            {t("settings.paymentSettings")}
          </Typography>
          <SettingSectionContent>
            <SettingForm title={t("settings.currencyCode")} lgWidth={5}>
              <FormControl fullWidth>
                <DenseSelect
                  value={values.currency_code ?? "USD"}
                  onChange={(e) => patchSetting("currency_code", e.target.value as string)}
                >
                  <SquareMenuItem value="USD" onClick={() => onSelectCurrency("USD", "$", 100)}>
                    <ListItemText slotProps={{ primary: { variant: "body2" } }}>USD</ListItemText>
                  </SquareMenuItem>
                  <SquareMenuItem value="CNY" onClick={() => onSelectCurrency("CNY", "¥", 100)}>
                    <ListItemText slotProps={{ primary: { variant: "body2" } }}>CNY</ListItemText>
                  </SquareMenuItem>
                  <SquareMenuItem value="EUR" onClick={() => onSelectCurrency("EUR", "€", 100)}>
                    <ListItemText slotProps={{ primary: { variant: "body2" } }}>EUR</ListItemText>
                  </SquareMenuItem>
                  <SquareMenuItem value="JPY" onClick={() => onSelectCurrency("JPY", "¥", 1)}>
                    <ListItemText slotProps={{ primary: { variant: "body2" } }}>JPY</ListItemText>
                  </SquareMenuItem>
                </DenseSelect>
                <NoMarginHelperText>{t("settings.currencyCodeDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <SettingForm title={t("settings.currencySymbol")} lgWidth={5}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.currency_symbol ?? ""}
                  onChange={(e) => patchSetting("currency_symbol", e.target.value)}
                />
                <NoMarginHelperText>{t("settings.currencySymbolDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <SettingForm title={t("settings.currencyUnit")} lgWidth={5}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  type="number"
                  value={values.currency_unit ?? ""}
                  onChange={(e) => patchSetting("currency_unit", e.target.value)}
                />
                <NoMarginHelperText>{t("settings.currencyUnitDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t("settings.paymentProviders")}
              </Typography>
              <SettingForm lgWidth={6}>
                <PaymentProviders config={paymentConfig} />
              </SettingForm>
            </Box>
          </SettingSectionContent>
        </SettingSection>

        <SettingSection>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
            {t("settings.storageProductSettings")}
          </Typography>
          <SettingSectionContent>
            <SettingForm lgWidth={12}>
              <FormControl fullWidth>
                <StorageProducts />
                <NoMarginHelperText>{t("settings.storageProductsDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

        <SettingSection>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
            {t("settings.groupProductSettings")}
          </Typography>
          <SettingSectionContent>
            <SettingForm lgWidth={12}>
              <FormControl fullWidth>
                <GroupProducts />
                <NoMarginHelperText>{t("settings.groupProductsDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

        <SettingSection>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
            {t("giftCodes.giftCodesSettings")}
          </Typography>
          <SettingSectionContent>
            <GiftCodes storageProductsConfig={storageProducts} groupProductsConfig={groupSellData} />
          </SettingSectionContent>
        </SettingSection>
      </Stack>
    </Box>
  );
};

export default VAS;
