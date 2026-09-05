import {
  Box,
  DialogContent,
  FormControl,
  FormControlLabel,
  Grid2,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AnyAction } from "redux";
import { ThunkDispatch } from "redux-thunk";
import {
  DenseFilledTextField,
  NoWrapCell,
  SecondaryButton,
  StyledTableContainerPaper,
} from "../../../Common/StyledComponents.tsx";
import GroupSelectionInput from "../../Common/GroupSelectionInput.tsx";
import DraggableDialog from "../../../Dialogs/DraggableDialog.tsx";
import Add from "../../../Icons/Add.tsx";
import Delete from "../../../Icons/Delete.tsx";
import Edit from "../../../Icons/Edit.tsx";
import SettingForm from "../../../Pages/Setting/SettingForm.tsx";
import {
  createProduct,
  deleteProduct,
  listProducts,
  Product,
  ProductType,
  updateProduct,
  UpsertProductService,
} from "../../../../api/proVAS.ts";
import { confirmOperation } from "../../../../redux/thunks/dialog.ts";
import TablePagination from "../../Common/TablePagination.tsx";
import { NoMarginHelperText } from "../Settings.tsx";

interface GroupProductFormState {
  name: string;
  price: string;
  duration_days: string;
  group_id: string;
  highlight: boolean;
  enabled: boolean;
  description: string;
}

const emptyForm = (): GroupProductFormState => ({
  name: "",
  price: "",
  duration_days: "",
  group_id: "",
  highlight: false,
  enabled: true,
  description: "",
});

const productToForm = (p: Product): GroupProductFormState => ({
  name: p.name,
  price: p.price != null ? String(p.price) : "",
  duration_days: p.props?.duration_days != null ? String(p.props.duration_days) : "",
  group_id: p.props?.group_id != null ? String(p.props.group_id) : "",
  highlight: p.highlight,
  enabled: p.enabled,
  description: (p.props?.description || []).join("\n"),
});

interface GroupProductDialogProps {
  open: boolean;
  editing?: Product;
  onClose: () => void;
  onSaved: () => void;
}

const GroupProductDialog = ({ open, editing, onClose, onSaved }: GroupProductDialogProps) => {
  const { t } = useTranslation("dashboard");
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
  const { enqueueSnackbar } = useSnackbar();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<GroupProductFormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editing ? productToForm(editing) : emptyForm());
    }
  }, [open, editing]);

  const update = (patch: Partial<GroupProductFormState>) => {
    setForm((f) => ({ ...f, ...patch }));
  };

  const handleSave = () => {
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
    setSaving(true);
    const service: UpsertProductService = {
      id: editing?.id,
      name: form.name,
      type: ProductType.Group,
      price: parseInt(form.price) || 0,
      highlight: form.highlight,
      enabled: form.enabled,
      props: {
        group_id: form.group_id !== "" ? parseInt(form.group_id) : undefined,
        duration_days: form.duration_days !== "" ? parseInt(form.duration_days) : undefined,
        description: form.description
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== ""),
      },
    };
    const action = editing ? updateProduct(editing.id, service) : createProduct({ ...service, id: undefined });
    dispatch(action)
      .then(() => {
        enqueueSnackbar(t("settings.saved"), { variant: "success" });
        onClose();
        onSaved();
      })
      .catch((e) => enqueueSnackbar(String(e), { variant: "error" }))
      .finally(() => setSaving(false));
  };

  return (
    <DraggableDialog
      title={editing ? t("settings.editGroupProduct") : t("vas.addMembership")}
      showActions
      showCancel
      onAccept={handleSave}
      loading={saving}
      dialogProps={{
        open,
        onClose,
        fullWidth: true,
        maxWidth: "sm",
      }}
    >
      <DialogContent>
        <Box component="form" ref={formRef} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <SettingForm title={t("settings.displayName")} lgWidth={12}>
            <FormControl fullWidth>
              <DenseFilledTextField required value={form.name} onChange={(e) => update({ name: e.target.value })} />
            </FormControl>
          </SettingForm>

          <SettingForm title={t("vas.group")} lgWidth={12}>
            <FormControl fullWidth>
              <GroupSelectionInput required fullWidth value={form.group_id} onChange={(v) => update({ group_id: v })} />
              <NoMarginHelperText>{t("vas.groupDes")}</NoMarginHelperText>
            </FormControl>
          </SettingForm>

          <Grid2 container spacing={2} size={{ xs: 12 }}>
            <SettingForm title={t("vas.priceYuan")} lgWidth={6} noContainer>
              <FormControl fullWidth>
                <DenseFilledTextField
                  required
                  type="number"
                  value={form.price}
                  onChange={(e) => update({ price: e.target.value })}
                />
              </FormControl>
            </SettingForm>
            <SettingForm title={t("vas.durationDay")} lgWidth={6} noContainer>
              <FormControl fullWidth>
                <DenseFilledTextField
                  type="number"
                  value={form.duration_days}
                  onChange={(e) => update({ duration_days: e.target.value })}
                />
              </FormControl>
            </SettingForm>
          </Grid2>

          <SettingForm title={t("vas.productDescription")} lgWidth={12}>
            <FormControl fullWidth>
              <DenseFilledTextField
                multiline
                rows={3}
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
              />
              <NoMarginHelperText>{t("vas.productDescriptionDes")}</NoMarginHelperText>
            </FormControl>
          </SettingForm>

          <Box sx={{ display: "flex", gap: 3 }}>
            <FormControlLabel
              control={<Switch checked={form.highlight} onChange={(e) => update({ highlight: e.target.checked })} />}
              label={t("vas.highlight")}
            />
            <FormControlLabel
              control={<Switch checked={form.enabled} onChange={(e) => update({ enabled: e.target.checked })} />}
              label={t("vas.enable")}
            />
          </Box>
        </Box>
      </DialogContent>
    </DraggableDialog>
  );
};

const GroupProducts = () => {
  const { t } = useTranslation("dashboard");
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>(undefined);

  const load = async (pageSize: number) => {
    setLoading(true);
    try {
      const res = await dispatch(
        listProducts({
          page_size: pageSize,
          type: ProductType.Group,
        }),
      );
      setProducts(res.products || []);
      setTotal(res.pagination?.total_items || 0);
    } catch (e) {
      enqueueSnackbar(String(e), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(pageSize);
  }, [page, pageSize]);

  const handleAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const handleDelete = (p: Product) => {
    dispatch(confirmOperation(t("common:areYouSure")))
      .then(() => {
        dispatch(deleteProduct(p.id))
          .then(() => {
            enqueueSnackbar(t("settings.saved"), { variant: "success" });
            load(pageSize);
          })
          .catch((e) => enqueueSnackbar(String(e), { variant: "error" }));
      })
      .catch(() => {});
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <SecondaryButton variant="contained" startIcon={<Add />} onClick={handleAdd}>
          {t("settings.addGroupProduct")}
        </SecondaryButton>
      </Box>

      <TableContainer component={StyledTableContainerPaper}>
        <Table sx={{ width: "100%" }} size="small">
          <TableHead>
            <TableRow>
              <NoWrapCell>{t("settings.displayName")}</NoWrapCell>
              <NoWrapCell>{t("settings.price")}</NoWrapCell>
              <NoWrapCell>{t("vas.group")}</NoWrapCell>
              <NoWrapCell>{t("settings.duration")}</NoWrapCell>
              <NoWrapCell>{t("settings.description")}</NoWrapCell>
              <NoWrapCell>{t("settings.actions")}</NoWrapCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 && !loading && (
              <TableRow>
                <NoWrapCell colSpan={6} align="center">
                  <Typography variant="caption" color="text.secondary">
                    {t("application:setting.listEmpty")}
                  </Typography>
                </NoWrapCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id}>
                <NoWrapCell>{p.name}</NoWrapCell>
                <NoWrapCell>{p.price}</NoWrapCell>
                <NoWrapCell>{p.props?.group_id ?? "-"}</NoWrapCell>
                <NoWrapCell>{p.props?.duration_days ?? "-"}</NoWrapCell>
                <NoWrapCell>{(p.props?.description || []).join("\n") || "-"}</NoWrapCell>
                <NoWrapCell>
                  <IconButton size="small" onClick={() => handleEdit(p)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(p)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </NoWrapCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {total > 0 && (
        <Box sx={{ px: 1 }}>
          <TablePagination
            totalItems={total}
            page={page}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onRowsPerPageChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
            onChange={(_, value) => setPage(value)}
          />
        </Box>
      )}

      <GroupProductDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => load(pageSize)}
      />
    </Box>
  );
};

export default GroupProducts;
