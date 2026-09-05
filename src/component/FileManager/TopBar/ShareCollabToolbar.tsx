import { Alert, Button, Stack, useMediaQuery, useTheme } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Share } from "../../../api/explorer.ts";
import { buyShare, uploadToShare } from "../../../api/proShareCollab.ts";
import { addShareInfo } from "../../../redux/globalStateSlice.ts";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { refreshFileList } from "../../../redux/thunks/filemanager.ts";
import { queueLoadShareInfo } from "../../../redux/thunks/share.ts";
import SessionManager from "../../../session/index.ts";
import CrUri, { Filesystem } from "../../../util/uri.ts";
import { RadiusFrame } from "../../Frame/RadiusFrame.tsx";
import Tag from "../../Icons/Tag.tsx";
import Upload from "../../Icons/Upload.tsx";
import { FmIndexContext } from "../FmIndexContext.tsx";

const ShareCollabToolbar = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useAppDispatch();
  const fmIndex = useContext(FmIndexContext);
  const purePath = useAppSelector((s) => s.fileManager[fmIndex].pure_path);
  const currentFs = useAppSelector((s) => s.fileManager[fmIndex].current_fs);
  const singleFileView = useAppSelector((s) => s.fileManager[fmIndex].list?.single_file_view);
  const [shareInfo, setShareInfo] = useState<Share | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isShare = currentFs === Filesystem.share;

  useEffect(() => {
    if (!isShare || !purePath) {
      setShareInfo(null);
      return;
    }
    dispatch(queueLoadShareInfo(new CrUri(purePath)))
      .then((info) => {
        setShareInfo(info);
        setPurchased(!!info.purchased);
      })
      .catch(() => {
        setShareInfo(null);
      });
  }, [isShare, purePath, dispatch]);

  const currentUser = SessionManager.currentLoginOrNull();
  const shareId = purePath ? new CrUri(purePath).id() : undefined;
  const unlocked = purchased || (shareInfo?.price ?? 0) <= 0;
  const canUpload =
    !!shareInfo &&
    !!shareInfo.allow_upload &&
    !!shareId &&
    !!purePath &&
    unlocked &&
    (!!currentUser || !!shareInfo.allow_anonymous_upload);
  const needPurchase = !!shareInfo && (shareInfo.price ?? 0) > 0 && !purchased;

  const onUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !shareInfo || !shareId || !purePath) {
        return;
      }
      setBusy(true);
      let count = 0;
      try {
        for (const file of Array.from(files)) {
          const uri = new CrUri(purePath).join(file.name).toString();
          try {
            await dispatch(uploadToShare(shareId, uri, file));
            count++;
          } catch {
            // error snackbar is handled by send()
          }
        }
        if (count > 0) {
          enqueueSnackbar({
            message: t("application:share.uploadedToShare", { num: count }),
            variant: "success",
          });
          await dispatch(refreshFileList(fmIndex));
        }
      } finally {
        setBusy(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [shareInfo, shareId, purePath, fmIndex, dispatch, t],
  );

  const buy = useCallback(async () => {
    if (!shareInfo || !purePath) {
      return;
    }
    setBusy(true);
    try {
      const res = await dispatch(buyShare(shareInfo.id));
      if (res?.purchased) {
        setPurchased(true);
        const key = `${new CrUri(purePath).id()}/${new CrUri(purePath).password()}/false`;
        dispatch(addShareInfo({ id: key, info: { ...shareInfo, purchased: true } }));
      }
    } finally {
      setBusy(false);
    }
  }, [shareInfo, purePath, dispatch]);

  if (!isShare || singleFileView || !shareInfo || (!canUpload && !needPurchase)) {
    return null;
  }

  return (
    <>
      <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => onUpload(e.target.files)} />
      <Stack direction="column" spacing={1} sx={{ px: isMobile ? 2 : "initial" }}>
        {canUpload && (
          <RadiusFrame sx={{ p: 0.5, display: "flex" }}>
            <Button
              size="small"
              variant="outlined"
              disabled={busy}
              startIcon={<Upload />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("application:share.collabUploadFiles")}
            </Button>
          </RadiusFrame>
        )}
        {needPurchase && (
          <Alert
            severity="warning"
            action={
              currentUser ? (
                <Button color="inherit" size="small" onClick={buy} disabled={busy} startIcon={<Tag />}>
                  {t("application:share.buyWithCredits", {
                    price: shareInfo.price ?? 0,
                  })}
                </Button>
              ) : undefined
            }
          >
            {t("application:share.purchaseRequired")}
          </Alert>
        )}
      </Stack>
    </>
  );
};

export default ShareCollabToolbar;
