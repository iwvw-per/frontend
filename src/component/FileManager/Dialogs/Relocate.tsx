import { DialogContent, FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getStoragePolicyList } from "../../../api/api.ts";
import { StoragePolicy as AdminStoragePolicy } from "../../../api/dashboard.ts";
import { FileType } from "../../../api/explorer.ts";
import { createRelocateTask } from "../../../api/proMigrate.ts";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { closeRelocateDialog } from "../../../redux/globalStateSlice.ts";
import { refreshFileList } from "../../../redux/thunks/filemanager.ts";
import { getFileLinkedUri } from "../../../util";
import { ViewTaskAction } from "../../Common/Snackbar/snackbar.tsx";
import DraggableDialog from "../../Dialogs/DraggableDialog.tsx";

const Relocate = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const open = useAppSelector((state) => state.globalState.relocateDialogOpen);
  const targets = useAppSelector((state) => state.globalState.relocateDialogTargets ?? []);
  const fmIndex = useAppSelector((state) => state.globalState.relocateDialogFmIndex ?? 0);

  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<AdminStoragePolicy[]>([]);
  const [targetPolicyId, setTargetPolicyId] = useState<number>(0);

  const hasFolder = targets.some((target) => target.type == FileType.folder);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTargetPolicyId(0);
    setPolicies([]);
    setLoading(true);
    dispatch(getStoragePolicyList({ page: 1, page_size: 1000, order_by: "id", order_direction: "asc" }))
      .then((res) => {
        setPolicies(res.policies.filter((policy) => policy.type != "load_balance"));
      })
      .catch(() => {
        enqueueSnackbar({
          message: t("modals.failedToLoad"),
          variant: "error",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, dispatch, enqueueSnackbar, t]);

  const onClose = useCallback(() => {
    if (!loading) {
      dispatch(closeRelocateDialog());
    }
  }, [dispatch, loading]);

  const onAccept = useCallback(() => {
    if (!targetPolicyId || targets.length == 0) {
      return;
    }
    setLoading(true);
    Promise.allSettled(
      targets.map((target) =>
        dispatch(
          createRelocateTask({
            src_uri: getFileLinkedUri(target),
            target_policy_id: targetPolicyId,
            recursive: hasFolder,
          }),
        ),
      ),
    )
      .then((results) => {
        onClose();
        const failed = results.filter((result) => result.status == "rejected").length;
        if (failed > 0) {
          enqueueSnackbar({
            message: t("modals.taskCreateFailed", {
              failed,
              details: results
                .filter((result) => result.status == "rejected")
                .map((result) => (result as PromiseRejectedResult).reason?.message ?? "")
                .join("; "),
            }),
            variant: "error",
          });
        } else {
          enqueueSnackbar({
            message: t("modals.taskCreated"),
            variant: "success",
            action: ViewTaskAction(),
          });
          dispatch(refreshFileList(fmIndex));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [targets, targetPolicyId, hasFolder, dispatch, onClose, enqueueSnackbar, t, fmIndex]);

  return (
    <DraggableDialog
      title={t("application:fileManager.relocation")}
      showActions
      loading={loading}
      showCancel
      disabled={!targetPolicyId || policies.length == 0}
      onAccept={onAccept}
      dialogProps={{
        open: open ?? false,
        onClose: onClose,
        fullWidth: true,
        maxWidth: "sm",
        disableRestoreFocus: true,
      }}
    >
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel id="relocate-target-policy-label">{t("application:fileManager.storagePolicy")}</InputLabel>
            <Select
              labelId="relocate-target-policy-label"
              value={targetPolicyId}
              label={t("application:fileManager.storagePolicy")}
              disabled={loading}
              onChange={(e) => setTargetPolicyId(e.target.value as number)}
            >
              {policies.map((policy) => (
                <MenuItem key={policy.id} value={policy.id}>
                  {policy.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
    </DraggableDialog>
  );
};

export default Relocate;
