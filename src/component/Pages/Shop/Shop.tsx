import { LoadingButton } from "@mui/lab";
import { Box, Card, CardContent, Chip, Container, Grid2 as Grid, Paper, Stack, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "../../../redux/hooks";
import { PaymentProvider, ProductType } from "../../../api/proVAS.ts";
import { createOrder } from "../../../api/proPayment.ts";
import { getShop, redeemGiftCode, ShopProduct } from "../../../api/proShop.ts";
import { DenseFilledTextField } from "../../Common/StyledComponents.tsx";
import { DefaultCloseAction } from "../../Common/Snackbar/snackbar.tsx";
import Nothing from "../../Common/Nothing.tsx";
import PageContainer from "../PageContainer.tsx";
import PageHeader from "../PageHeader.tsx";

const formatBytes = (n?: number) => {
  if (!n) return "0";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = n;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

const Shop = () => {
  const { t } = useTranslation("application");
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [credit, setCredit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [giftCode, setGiftCode] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    dispatch(getShop())
      .then((res) => {
        setProducts(res.products ?? []);
        setCredit(res.credit ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const groups = useMemo(() => {
    return products.reduce<Record<string, ShopProduct[]>>((acc, p) => {
      (acc[p.type] = acc[p.type] ?? []).push(p);
      return acc;
    }, {});
  }, [products]);

  const buyWithCredits = (p: ShopProduct) => {
    if (!p.price_credits || p.price_credits <= 0) return;
    if (credit < p.price_credits) {
      enqueueSnackbar({
        message: t("shop.insufficientCredit"),
        variant: "error",
        action: DefaultCloseAction,
      });
      return;
    }
    setBuying(p.hash_id ?? String(p.id));
    dispatch(
      createOrder({
        product_id: p.id,
        product_type: p.type,
        quantity: 1,
        provider: PaymentProvider.Credits,
      }),
    )
      .then(() => {
        enqueueSnackbar({
          message: t("shop.purchaseSuccess"),
          variant: "success",
          action: DefaultCloseAction,
        });
        refresh();
      })
      .catch((err: any) => {
        enqueueSnackbar({
          message: err?.message ?? t("shop.purchaseFailed"),
          variant: "error",
          action: DefaultCloseAction,
        });
        refresh();
      })
      .finally(() => setBuying(null));
  };

  const redeem = () => {
    if (!giftCode.trim()) return;
    setRedeeming(true);
    dispatch(redeemGiftCode(giftCode.trim()))
      .then((res) => {
        enqueueSnackbar({
          message: t("shop.redeemSuccess", { product: res?.product?.name ?? "" }),
          variant: "success",
          action: DefaultCloseAction,
        });
        setGiftCode("");
        refresh();
      })
      .catch((err: any) => {
        enqueueSnackbar({
          message: err?.message ?? t("shop.redeemFailed"),
          variant: "error",
          action: DefaultCloseAction,
        });
      })
      .finally(() => setRedeeming(false));
  };

  const productSubtitle = (p: ShopProduct): string => {
    switch (p.type) {
      case ProductType.StoragePack:
        return `${formatBytes(p.storage_size)}${p.duration_days ? " / " + p.duration_days + "d" : ""}`;
      case ProductType.Credit:
        return `${p.credit_amount ?? 0} credits`;
      default:
        return "";
    }
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <PageHeader title={t("shop.title")} onRefresh={() => refresh()} loading={loading} />
        <Paper
          variant={"outlined"}
          sx={{
            p: 2,
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="h6">{t("shop.creditBalance", { credit })}</Typography>
          <Stack direction={"row"} spacing={1}>
            <DenseFilledTextField
              placeholder={t("shop.giftCodePlaceholder")}
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
              disabled={redeeming}
            />
            <LoadingButton
              variant="contained"
              loading={redeeming}
              disabled={!giftCode.trim()}
              onClick={redeem}
              size="small"
            >
              {t("shop.redeem")}
            </LoadingButton>
          </Stack>
        </Paper>

        {!loading && products.length === 0 && (
          <Box sx={{ p: 1, width: "100%", textAlign: "center" }}>
            <Nothing size={0.8} top={63} primary={t("setting.listEmpty")} />
          </Box>
        )}

        {Object.entries(groups).map(([type, items]) => {
          const title =
            type === ProductType.StoragePack
              ? t("shop.storagePack")
              : type === ProductType.Group
                ? t("shop.groupPack")
                : t("shop.creditPack");
          return (
            <Box key={type} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {title}
              </Typography>
              <Grid container spacing={2}>
                {items.map((p) => (
                  <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                      variant={p.highlight ? "elevation" : "outlined"}
                      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="h6">{p.name}</Typography>
                          {p.highlight && <Chip size="small" color="primary" label={t("shop.highlight")} />}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {productSubtitle(p)}
                        </Typography>
                        {p.description && (
                          <Box sx={{ mt: 1 }}>
                            {p.description.map((d, i) => (
                              <Typography key={i} variant="caption" color="text.secondary" display="block">
                                {"• " + d}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                      <Box sx={{ p: 2, pt: 0 }}>
                        {p.price > 0 && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {t("shop.price", { price: (p.price / 100).toFixed(2) })}
                          </Typography>
                        )}
                        {p.price_credits && p.price_credits > 0 ? (
                          <LoadingButton
                            fullWidth
                            size="small"
                            variant="contained"
                            loading={buying === (p.hash_id ?? String(p.id))}
                            onClick={() => buyWithCredits(p)}
                          >
                            {t("shop.buyWithCredits", { credits: p.price_credits })}
                          </LoadingButton>
                        ) : (
                          <LoadingButton fullWidth size="small" variant="outlined" disabled>
                            {t("shop.payChannelNotConfigured")}
                          </LoadingButton>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Container>
    </PageContainer>
  );
};

export default Shop;
