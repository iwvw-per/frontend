import { Alert, Box } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Announcement, getPublicAnnouncement } from "../../api/proAnnouncement.ts";
import { useAppDispatch } from "../../redux/hooks.ts";

const AnnouncementBanner = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("dashboard");
  const [announcement, setAnnouncement] = useState<Announcement>();

  useEffect(() => {
    dispatch(getPublicAnnouncement())
      .then((res) => setAnnouncement(res))
      .catch(() => setAnnouncement(undefined));
  }, [dispatch]);

  if (!announcement || !announcement.enabled || !announcement.content) {
    return null;
  }

  return (
    <Alert severity="info" sx={{ borderRadius: 0 }} icon={false}>
      <Box component="span" sx={{ fontWeight: 600, mr: 1 }}>
        {t("settings.announcement")}:
      </Box>
      {announcement.content}
    </Alert>
  );
};

export default AnnouncementBanner;
