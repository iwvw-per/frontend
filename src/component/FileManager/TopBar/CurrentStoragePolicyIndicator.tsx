import { Box, Stack, Typography } from "@mui/material";
import { memo, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../../redux/hooks.ts";
import { RadiusFrame } from "../../Frame/RadiusFrame.tsx";
import StorageOutlined from "../../Icons/StorageOutlined.tsx";
import { FmIndexContext } from "../FmIndexContext.tsx";

const CurrentStoragePolicyIndicator = () => {
  const { t } = useTranslation();
  const fmIndex = useContext(FmIndexContext);
  const storagePolicy = useAppSelector((s) => s.fileManager[fmIndex].list?.storage_policy);

  if (!storagePolicy) {
    return null;
  }

  const isLoadBalance = storagePolicy.type === "load_balance";

  return (
    <RadiusFrame withBorder sx={{ p: 0.5, px: 1, mr: 1, display: "inline-flex" }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minHeight: 32 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "8px",
            bgcolor: (theme) =>
              theme.palette.mode === "light" ? theme.palette.primary.main : theme.palette.primary.dark,
            color: (theme) => theme.palette.primary.contrastText,
            flexShrink: 0,
          }}
        >
          <StorageOutlined fontSize="inherit" sx={{ fontSize: 16 }} />
        </Box>
        <Stack direction="row" spacing={1} alignItems="baseline" sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {storagePolicy.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              textTransform: "uppercase",
              px: 0.75,
              py: 0.25,
              borderRadius: "4px",
              bgcolor: (theme) => (theme.palette.mode === "light" ? theme.palette.grey[200] : theme.palette.grey[800]),
              color: "text.secondary",
              flexShrink: 0,
            }}
          >
            {storagePolicy.type}
          </Typography>
          {isLoadBalance && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {t("application:fileManager.loadBalancePolicy")}
            </Typography>
          )}
        </Stack>
      </Stack>
    </RadiusFrame>
  );
};

export default memo(CurrentStoragePolicyIndicator);
