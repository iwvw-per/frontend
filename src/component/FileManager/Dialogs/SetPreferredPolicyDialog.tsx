import { Box, DialogContent, FormControl, InputLabel, MenuItem, Select, styled } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { getUserPolicies, setFilePolicy, UserPolicy } from "../../../api/proPolicy.ts";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { closePreferredPolicyDialog, setPreferredPolicyDialog } from "../../../redux/globalStateSlice.ts";
import DraggableDialog from "../../Dialogs/DraggableDialog.tsx";

const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const SetPreferredPolicyDialog = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const open = useAppSelector((state) => state.globalState.preferredPolicyDialogOpen);
  const file = useAppSelector((state) => state.globalState.preferredPolicyDialogFile);

  const [policies, setPolicies] = useState<UserPolicy[]>([]);
  const [selected, setSelected] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLoading(true);
    dispatch(getUserPolicies())
      .then((res) => {
        const list = res ?? [];
        setPolicies(list);
        const current = file?.preferred_storage_policy_id ?? 0;
        const matched = list.find((p) => p.storage_policy_id === current);
        setSelected(matched ? current : list[0]?.storage_policy_id ?? 0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, file, dispatch]);

  const onClose = useCallback(() => {
    if (!loading) {
      dispatch(closePreferredPolicyDialog());
    }
  }, [dispatch, loading]);

  const onAccept = useCallback(async () => {
    if (!file) {
      return;
    }
    setLoading(true);
    try {
      await dispatch(setFilePolicy({ uri: file.path, storage_policy_id: selected }));
      enqueueSnackbar(t("application:fileManager.setPreferredPolicyDone"), { variant: "success" });
      dispatch(
        setPreferredPolicyDialog({
          open: false,
        }),
      );
    } catch {
      enqueueSnackbar(t("application:fileManager.setPreferredPolicyFailed"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [dispatch, file, selected, enqueueSnackbar, t]);

  return (
    <DraggableDialog
      title={t("application:fileManager.setPreferredPolicy")}
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
            <InputLabel id="preferred-policy-label">{t("application:fileManager.preferredPolicy")}</InputLabel>
            <Select
              labelId="preferred-policy-label"
              value={selected}
              label={t("application:fileManager.preferredPolicy")}
              onChange={(e) => setSelected(Number(e.target.value))}
            >
              <MenuItem value={0}>{t("application:fileManager.preferredPolicyNone")}</MenuItem>
              {policies.map((p) => (
                <MenuItem key={p.id} value={p.storage_policy_id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </StyledBox>
      </DialogContent>
    </DraggableDialog>
  );
};

export default SetPreferredPolicyDialog;
