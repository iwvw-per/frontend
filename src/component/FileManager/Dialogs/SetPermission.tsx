import { useTranslation } from "react-i18next";
import {
  Autocomplete,
  Box,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  styled,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { useCallback, useEffect, useState } from "react";
import DraggableDialog from "../../Dialogs/DraggableDialog.tsx";
import { closeFilePermissionDialog, setFilePermissionDialog } from "../../../redux/globalStateSlice.ts";
import { FileAccessRule } from "../../../api/explorer.ts";
import { setFilePermission } from "../../../api/proPermission.ts";

const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  minHeight: "300px",
}));

const toIdList = (values: string[]): number[] =>
  values
    .map((v) => parseInt(v, 10))
    .filter((v) => !isNaN(v) && v > 0)
    .filter((v, index, arr) => arr.indexOf(v) === index);

const SetPermission = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const open = useAppSelector((state) => state.globalState.filePermissionDialogOpen);
  const file = useAppSelector((state) => state.globalState.filePermissionDialogFile);

  const [loading, setLoading] = useState(false);
  const [allowUsers, setAllowUsers] = useState<string[]>([]);
  const [denyUsers, setDenyUsers] = useState<string[]>([]);
  const [allowGroups, setAllowGroups] = useState<string[]>([]);
  const [denyGroups, setDenyGroups] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState<number>(0);

  useEffect(() => {
    if (open) {
      const rule: FileAccessRule | undefined = file?.permissions;
      setAllowUsers((rule?.allow_users ?? []).map((id) => String(id)));
      setDenyUsers((rule?.deny_users ?? []).map((id) => String(id)));
      setAllowGroups((rule?.allow_groups ?? []).map((id) => String(id)));
      setDenyGroups((rule?.deny_groups ?? []).map((id) => String(id)));
      setAnonymous(rule?.anonymous ?? 0);
    }
  }, [open, file]);

  const onClose = useCallback(() => {
    if (!loading) {
      dispatch(closeFilePermissionDialog());
    }
  }, [dispatch, loading]);

  const onAccept = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    try {
      await dispatch(
        setFilePermission({
          uri: file.path,
          allow_users: toIdList(allowUsers),
          deny_users: toIdList(denyUsers),
          allow_groups: toIdList(allowGroups),
          deny_groups: toIdList(denyGroups),
          anonymous,
        }),
      );
      dispatch(
        setFilePermissionDialog({
          open: false,
        }),
      );
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [dispatch, file, allowUsers, denyUsers, allowGroups, denyGroups, anonymous]);

  return (
    <DraggableDialog
      title={t("application:fileManager.setPermission")}
      showActions
      loading={loading}
      showCancel
      dialogProps={{
        open: open ?? false,
        onClose: onClose,
        fullWidth: true,
        maxWidth: "sm",
      }}
      onAccept={onAccept}
    >
      <DialogContent sx={{ pt: 1 }}>
        <StyledBox>
          <FormControl fullWidth>
            <InputLabel id="anonymous-level-label">{t("application:fileManager.anonymousLevel")}</InputLabel>
            <Select
              labelId="anonymous-level-label"
              value={anonymous}
              label={t("application:fileManager.anonymousLevel")}
              onChange={(e) => setAnonymous(Number(e.target.value))}
            >
              <MenuItem value={0}>{t("application:fileManager.anonymousInherit")}</MenuItem>
              <MenuItem value={1}>{t("application:fileManager.anonymousView")}</MenuItem>
              <MenuItem value={2}>{t("application:fileManager.anonymousDownload")}</MenuItem>
              <MenuItem value={3}>{t("application:fileManager.anonymousWrite")}</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            freeSolo
            fullWidth
            options={[]}
            value={allowUsers}
            onChange={(_e, value) => setAllowUsers(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label={t("application:fileManager.allowUsers")}
                placeholder={t("application:fileManager.allowUsersPlaceholder")}
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            fullWidth
            options={[]}
            value={denyUsers}
            onChange={(_e, value) => setDenyUsers(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label={t("application:fileManager.denyUsers")}
                placeholder={t("application:fileManager.denyUsersPlaceholder")}
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            fullWidth
            options={[]}
            value={allowGroups}
            onChange={(_e, value) => setAllowGroups(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label={t("application:fileManager.allowGroups")}
                placeholder={t("application:fileManager.allowGroupsPlaceholder")}
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            fullWidth
            options={[]}
            value={denyGroups}
            onChange={(_e, value) => setDenyGroups(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label={t("application:fileManager.denyGroups")}
                placeholder={t("application:fileManager.denyGroupsPlaceholder")}
              />
            )}
          />
        </StyledBox>
      </DialogContent>
    </DraggableDialog>
  );
};

export default SetPermission;
