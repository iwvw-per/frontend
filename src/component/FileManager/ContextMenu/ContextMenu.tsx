import { Box, Divider, ListItemIcon, ListItemText, Menu, MenuItem, styled, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Share } from "../../../api/explorer.ts";
import { deleteFromShare, renameInShare } from "../../../api/proShareCollab.ts";
import {
  closeContextMenu,
  closeRenameFileModal,
  setFileDeleteModal,
  setRenameFileModalLoading,
} from "../../../redux/fileManagerSlice.ts";
import { deleteConfirmation, renameForm } from "../../../redux/thunks/dialog.ts";
import { queueLoadShareInfo } from "../../../redux/thunks/share.ts";
import SessionManager from "../../../session/index.ts";
import CrUri, { Filesystem } from "../../../util/uri.ts";
import { CreateNewDialogType } from "../../../redux/globalStateSlice.ts";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { downloadFiles } from "../../../redux/thunks/download.ts";
import {
  batchGetDirectLinks,
  createNew,
  deleteFile,
  dialogBasedMoveCopy,
  enterFolder,
  extractArchive,
  goToParent,
  goToSharedLink,
  newRemoteDownload,
  openShareDialog,
  openSidebar,
  renameFile,
  restoreFile,
} from "../../../redux/thunks/file.ts";
import { refreshFileList, uploadClicked, uploadFromClipboard } from "../../../redux/thunks/filemanager.ts";
import { openViewers } from "../../../redux/thunks/viewer.ts";
import AppFolder from "../../Icons/AppFolder.tsx";
import ArchiveArrow from "../../Icons/ArchiveArrow.tsx";
import ArrowSync from "../../Icons/ArrowSync.tsx";
import BinFullOutlined from "../../Icons/BinFullOutlined.tsx";
import Clipboard from "../../Icons/Clipboard.tsx";
import CloudDownloadOutlined from "../../Icons/CloudDownloadOutlined.tsx";
import CopyOutlined from "../../Icons/CopyOutlined.tsx";
import DeleteOutlined from "../../Icons/DeleteOutlined.tsx";
import Download from "../../Icons/Download.tsx";
import Enter from "../../Icons/Enter.tsx";
import FileAdd from "../../Icons/FileAdd.tsx";
import FolderAdd from "../../Icons/FolderAdd.tsx";
import FolderArrowUp from "../../Icons/FolderArrowUp.tsx";
import FolderLink from "../../Icons/FolderLink.tsx";
import FolderOutlined from "../../Icons/FolderOutlined.tsx";
import HistoryOutlined from "../../Icons/HistoryOutlined.tsx";
import Info from "../../Icons/Info.tsx";
import LinkOutlined from "../../Icons/LinkOutlined.tsx";
import Open from "../../Icons/Open.tsx";
import RenameOutlined from "../../Icons/RenameOutlined.tsx";
import ShareOutlined from "../../Icons/ShareOutlined.tsx";
import Tag from "../../Icons/Tag.tsx";
import Upload from "../../Icons/Upload.tsx";
import WrenchSettings from "../../Icons/WrenchSettings.tsx";
import { SelectType } from "../../Uploader/core";
import { CascadingSubmenu } from "./CascadingMenu.tsx";
import MoreMenuItems from "./MoreMenuItems.tsx";
import NewFileTemplateMenuItems from "./NewFileTemplateMenuItems.tsx";
import OpenWithMenuItems from "./OpenWithMenuItems.tsx";
import OrganizeMenuItems from "./OrganizeMenuItems.tsx";
import TagMenuItems from "./TagMenuItems.tsx";
import useActionDisplayOpt from "./useActionDisplayOpt.ts";

export const SquareMenu = styled(Menu)(() => ({
  "& .MuiPaper-root": {
    minWidth: "200px",
  },
}));

export const SquareMenuItem = styled(MenuItem)<{ hoverColor?: string }>(({ theme, hoverColor }) => ({
  "&:hover .MuiListItemIcon-root": {
    color: hoverColor ?? theme.palette.primary.main,
  },
}));

export const DenseDivider = styled(Divider)(() => ({
  margin: "4px 0 !important",
}));

export const EmptyMenu = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 0.5, px: 1, display: "flex", alignItems: "center" }} color={"text.secondary"}>
      <Info sx={{ mr: 1 }} />
      <Typography variant="body2">{t("fileManager.noActionsCanBeDone")}</Typography>
    </Box>
  );
};

export interface ContextMenuProps {
  fmIndex: number;
}

const ContextMenu = ({ fmIndex = 0 }: ContextMenuProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const contextMenuOpen = useAppSelector((state) => state.fileManager[fmIndex].contextMenuOpen);
  const contextMenuType = useAppSelector((state) => state.fileManager[fmIndex].contextMenuType);
  const contextMenuPos = useAppSelector((state) => state.fileManager[fmIndex].contextMenuPos);
  const selected = useAppSelector((state) => state.fileManager[fmIndex].selected);
  const targetOverwrite = useAppSelector((state) => state.fileManager[fmIndex].contextMenuTargets);

  const targets = useMemo(() => {
    const targetsMap = targetOverwrite ?? selected;
    return Object.keys(targetsMap).map((key) => targetsMap[key]);
  }, [targetOverwrite, selected]);

  const parent = useAppSelector((state) => state.fileManager[fmIndex].list?.parent);
  const currentFs = useAppSelector((state) => state.fileManager[fmIndex].current_fs);
  const isShareFs = currentFs === Filesystem.share;
  const [shareCollabInfo, setShareCollabInfo] = useState<Share | null>(null);

  const shareId = targets.length > 0 ? new CrUri(targets[0].path).id() : undefined;

  useEffect(() => {
    if (!isShareFs || !contextMenuOpen || targets.length === 0 || !shareId) {
      setShareCollabInfo(null);
      return;
    }
    dispatch(queueLoadShareInfo(new CrUri(targets[0].path)))
      .then(setShareCollabInfo)
      .catch(() => setShareCollabInfo(null));
  }, [isShareFs, contextMenuOpen, shareId, targets, dispatch]);

  const currentUser = SessionManager.currentLoginOrNull();
  const unlockedShare = shareCollabInfo ? (shareCollabInfo.price ?? 0) <= 0 || !!shareCollabInfo.purchased : false;
  const showShareRename =
    isShareFs &&
    targets.length === 1 &&
    !!shareCollabInfo &&
    !!shareCollabInfo.allow_modify &&
    !!currentUser &&
    unlockedShare;
  const showShareDelete =
    isShareFs &&
    targets.length > 0 &&
    !!shareCollabInfo &&
    !!shareCollabInfo.allow_delete &&
    !!currentUser &&
    unlockedShare;

  const onShareRename = useCallback(async () => {
    if (!shareCollabInfo || !shareId || targets.length !== 1) {
      return;
    }
    dispatch(closeContextMenu({ index: fmIndex, value: undefined }));
    let newName = "";
    try {
      newName = await dispatch(renameForm(fmIndex, targets[0]));
    } catch {
      // operation canceled
      return;
    }
    dispatch(setRenameFileModalLoading({ index: fmIndex, value: true }));
    try {
      await dispatch(renameInShare(shareId, targets[0].path, newName));
      await dispatch(refreshFileList(fmIndex));
    } catch {
      // error snackbar is handled by send()
    } finally {
      dispatch(closeRenameFileModal({ index: fmIndex, value: undefined }));
    }
  }, [shareCollabInfo, shareId, targets, fmIndex, dispatch]);

  const onShareDelete = useCallback(async () => {
    if (!shareCollabInfo || !shareId || targets.length === 0) {
      return;
    }
    dispatch(closeContextMenu({ index: fmIndex, value: undefined }));
    try {
      await dispatch(deleteConfirmation(fmIndex, targets));
    } catch {
      // operation canceled
      return;
    }
    dispatch(setFileDeleteModal({ index: fmIndex, value: [true, targets, undefined, true] }));
    try {
      await dispatch(
        deleteFromShare(
          shareId,
          targets.map((f) => f.path),
        ),
      );
      await dispatch(refreshFileList(fmIndex));
    } catch {
      // error snackbar is handled by send()
    } finally {
      dispatch(setFileDeleteModal({ index: fmIndex, value: [false, targets, undefined, true] }));
    }
  }, [shareCollabInfo, shareId, targets, fmIndex, dispatch]);

  const displayOpt = useActionDisplayOpt(targets, contextMenuType, parent, fmIndex);
  const onClose = useCallback(() => {
    dispatch(closeContextMenu({ index: fmIndex, value: undefined }));
  }, [dispatch]);

  const showOpenWithCascading = displayOpt.showOpenWithCascading && displayOpt.showOpenWithCascading();
  const showOpenWith = displayOpt.showOpenWith && displayOpt.showOpenWith();
  let part1 =
    displayOpt.showOpen ||
    showOpenWithCascading ||
    showOpenWith ||
    displayOpt.showEnter ||
    displayOpt.showDownload ||
    displayOpt.showRemoteDownload ||
    displayOpt.showTorrentRemoteDownload ||
    displayOpt.showExtractArchive ||
    displayOpt.showUpload;
  let part2 =
    displayOpt.showCreateFolder ||
    displayOpt.showCreateFile ||
    displayOpt.showShare ||
    displayOpt.showRename ||
    displayOpt.showCopy ||
    displayOpt.showDirectLink ||
    showShareRename;
  let part3 =
    displayOpt.showTags || displayOpt.showOrganize || displayOpt.showMore || displayOpt.showNewFileFromTemplate;
  let part4 = displayOpt.showInfo || displayOpt.showGoToParent || displayOpt.showGoToSharedLink;
  let part5 = displayOpt.showRestore || displayOpt.showDelete || displayOpt.showRefresh || showShareDelete;
  const showDivider1 = part1 && part2;
  const showDivider2 = part2 && part3;
  const showDivider3 = part3 && part4;
  const showDivider4 = part4 && part5;

  const part1Elements = part1 ? (
    <>
      {displayOpt.showUpload && (
        <SquareMenuItem onClick={() => dispatch(uploadClicked(0, SelectType.File))}>
          <ListItemIcon>
            <Upload fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.uploadFiles")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showEnter && (
        <SquareMenuItem onClick={() => dispatch(enterFolder(0, targets[0]))}>
          <ListItemIcon>
            <Enter fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.enter")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showUpload && (
        <SquareMenuItem onClick={() => dispatch(uploadClicked(0, SelectType.Directory))}>
          <ListItemIcon>
            <FolderArrowUp fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.uploadFolder")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showUpload && (
        <SquareMenuItem onClick={() => dispatch(uploadFromClipboard(0))}>
          <ListItemIcon>
            <Clipboard fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:uploader.uploadFromClipboard")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showRemoteDownload && (
        <SquareMenuItem onClick={() => dispatch(newRemoteDownload(0))}>
          <ListItemIcon>
            <CloudDownloadOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.newRemoteDownloads")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showOpen && (
        <SquareMenuItem onClick={() => dispatch(openViewers(fmIndex, targets[0]))}>
          <ListItemIcon>
            <Open fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.open")}</ListItemText>
        </SquareMenuItem>
      )}
      {showOpenWithCascading && (
        <CascadingSubmenu
          popupId={"openWith"}
          title={t("application:fileManager.openWith")}
          icon={<AppFolder fontSize="small" />}
        >
          <OpenWithMenuItems displayOpt={displayOpt} targets={targets} />
        </CascadingSubmenu>
      )}
      {showOpenWith && (
        <SquareMenuItem onClick={() => dispatch(openViewers(fmIndex, targets[0], targets[0].size, undefined, true))}>
          <ListItemIcon>
            <AppFolder fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.openWith")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showDownload && (
        <SquareMenuItem onClick={() => dispatch(downloadFiles(fmIndex, targets))}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.download")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showExtractArchive && (
        <SquareMenuItem onClick={() => dispatch(extractArchive(fmIndex, targets[0]))}>
          <ListItemIcon>
            <ArchiveArrow fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.extractArchive")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showTorrentRemoteDownload && (
        <SquareMenuItem onClick={() => dispatch(newRemoteDownload(fmIndex, targets[0]))}>
          <ListItemIcon>
            <CloudDownloadOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.createRemoteDownloadForTorrent")}</ListItemText>
        </SquareMenuItem>
      )}
    </>
  ) : undefined;

  const part2Elements = part2 ? (
    <>
      {displayOpt.showCreateFolder && (
        <SquareMenuItem onClick={() => dispatch(createNew(fmIndex, CreateNewDialogType.folder))}>
          <ListItemIcon>
            <FolderAdd fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.newFolder")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showCreateFile && (
        <SquareMenuItem onClick={() => dispatch(createNew(fmIndex, CreateNewDialogType.file))}>
          <ListItemIcon>
            <FileAdd fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.newFile")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showShare && (
        <SquareMenuItem onClick={() => dispatch(openShareDialog(fmIndex, targets[0]))}>
          <ListItemIcon>
            <ShareOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.share")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showRename && (
        <SquareMenuItem onClick={() => dispatch(renameFile(fmIndex, targets[0]))}>
          <ListItemIcon>
            <RenameOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.rename")}</ListItemText>
        </SquareMenuItem>
      )}
      {showShareRename && (
        <SquareMenuItem onClick={onShareRename}>
          <ListItemIcon>
            <RenameOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.rename")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showCopy && (
        <SquareMenuItem onClick={() => dispatch(dialogBasedMoveCopy(fmIndex, targets, true))}>
          <ListItemIcon>
            <CopyOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.copy")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showDirectLink && (
        <SquareMenuItem onClick={() => dispatch(batchGetDirectLinks(fmIndex, targets))}>
          <ListItemIcon>
            <LinkOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.getSourceLink")}</ListItemText>
        </SquareMenuItem>
      )}
    </>
  ) : undefined;

  const part3Elements = part3 ? (
    <>
      {displayOpt.showTags && (
        <CascadingSubmenu popupId={"tags"} title={t("application:fileManager.tags")} icon={<Tag fontSize="small" />}>
          <TagMenuItems displayOpt={displayOpt} targets={targets} />
        </CascadingSubmenu>
      )}
      {displayOpt.showOrganize && (
        <CascadingSubmenu
          popupId={"organize"}
          title={t("application:fileManager.organize")}
          icon={<BinFullOutlined fontSize="small" />}
        >
          <OrganizeMenuItems displayOpt={displayOpt} targets={targets} />
        </CascadingSubmenu>
      )}
      {displayOpt.showMore && (
        <CascadingSubmenu
          popupId={"more"}
          title={t("application:fileManager.moreActions")}
          icon={<WrenchSettings fontSize="small" />}
        >
          <MoreMenuItems displayOpt={displayOpt} targets={targets} fmIndex={fmIndex} />
        </CascadingSubmenu>
      )}
      {displayOpt.showNewFileFromTemplate && <NewFileTemplateMenuItems displayOpt={displayOpt} targets={targets} />}
    </>
  ) : undefined;

  const part4Elements = part4 ? (
    <>
      {displayOpt.showGoToSharedLink && (
        <SquareMenuItem onClick={() => dispatch(goToSharedLink(fmIndex, targets[0]))}>
          <ListItemIcon>
            <FolderLink fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.goToSharedLink")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showGoToParent && (
        <SquareMenuItem onClick={() => dispatch(goToParent(0, targets[0]))}>
          <ListItemIcon>
            <FolderOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.openParentFolder")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showInfo && (
        <SquareMenuItem onClick={() => dispatch(openSidebar(fmIndex, targets[0]))}>
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.viewDetails")}</ListItemText>
        </SquareMenuItem>
      )}
    </>
  ) : undefined;

  const part5Elements = part5 ? (
    <>
      {displayOpt.showRestore && (
        <SquareMenuItem onClick={() => dispatch(restoreFile(fmIndex, targets))}>
          <ListItemIcon>
            <HistoryOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.restore")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showDelete && (
        <SquareMenuItem hoverColor={theme.palette.error.light} onClick={() => dispatch(deleteFile(fmIndex, targets))}>
          <ListItemIcon>
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.delete")}</ListItemText>
        </SquareMenuItem>
      )}
      {showShareDelete && (
        <SquareMenuItem hoverColor={theme.palette.error.light} onClick={onShareDelete}>
          <ListItemIcon>
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.delete")}</ListItemText>
        </SquareMenuItem>
      )}
      {displayOpt.showRefresh && (
        <SquareMenuItem onClick={() => dispatch(refreshFileList(fmIndex))}>
          <ListItemIcon>
            <ArrowSync fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("application:fileManager.refresh")}</ListItemText>
        </SquareMenuItem>
      )}
    </>
  ) : undefined;

  const allParts = [part1Elements, part2Elements, part3Elements, part4Elements, part5Elements].filter(
    (p) => p != undefined,
  );

  return (
    <SquareMenu
      keepMounted
      onClose={onClose}
      disableAutoFocusItem
      open={Boolean(contextMenuOpen)}
      anchorReference="anchorPosition"
      anchorPosition={{
        top: contextMenuPos?.y ?? 0,
        left: contextMenuPos?.x ?? 0,
      }}
      MenuListProps={{
        dense: true,
      }}
      componentsProps={{
        root: {
          onContextMenu: (e) => {
            e.preventDefault();
          },
        },
      }}
    >
      {allParts.map((part, index) => (
        <>
          {part}
          {index < allParts.length - 1 && <DenseDivider />}
        </>
      ))}
      {allParts.length == 0 && <EmptyMenu />}
    </SquareMenu>
  );
};

export default ContextMenu;
