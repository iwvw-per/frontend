import {
  Box,
  Checkbox,
  Chip,
  DialogContent,
  FormControl,
  IconButton,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AnyAction } from "redux";
import { ThunkDispatch } from "redux-thunk";
import {
  DenseFilledTextField,
  DenseSelect,
  NoWrapCell,
  SecondaryButton,
  StyledTableContainerPaper,
} from "../../../Common/StyledComponents.tsx";
import DraggableDialog from "../../../Dialogs/DraggableDialog.tsx";
import { SquareMenuItem } from "../../../FileManager/ContextMenu/ContextMenu.tsx";
import Add from "../../../Icons/Add.tsx";
import Delete from "../../../Icons/Delete.tsx";
import SettingForm from "../../../Pages/Setting/SettingForm.tsx";
import {
  batchDeleteGiftCodes,
  createGiftCodes,
  GiftCode,
  listGiftCodes,
  listProducts,
  Product,
  ProductType,
} from "../../../../api/proVAS.ts";
import { confirmOperation } from "../../../../redux/thunks/dialog.ts";
import { copyToClipboard } from "../../../../util/index.ts";
import TablePagination from "../../Common/TablePagination.tsx";
import { NoMarginHelperText } from "../Settings.tsx";

interface GiftCodesProps {
  storageProductsConfig: string;
  groupProductsConfig: string;
}

// Pagination params
interface PaginationParams {
  page: number;
  perPage: number;
  total: number;
}

const GiftCodeStatusChip = ({ used }: { used: boolean }) => {
  const { t } = useTranslation("dashboard");

  return (
    <Chip
      color={used ? "default" : "success"}
      label={used ? t("giftCodes.giftCodeUsed") : t("giftCodes.giftCodeUnused")}
      size="small"
    />
  );
};

interface GenerateGiftCodesDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

const GenerateGiftCodesDialog = ({ open, onClose, onGenerated }: GenerateGiftCodesDialogProps) => {
  const { t } = useTranslation("dashboard");
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState<Product[]>([]);
  const [linkedProduct, setLinkedProduct] = useState("");
  const [count, setCount] = useState("10");
  const [productQty, setProductQty] = useState("1");
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setGeneratedCodes([]);
    setGenerating(false);
    const loadProducts = async () => {
      try {
        const [storageRes, groupRes] = await Promise.all([
          dispatch(listProducts({ page_size: 100, type: ProductType.StoragePack })),
          dispatch(listProducts({ page_size: 100, type: ProductType.Group })),
        ]);
        setProducts([...(storageRes.products || []), ...(groupRes.products || [])]);
      } catch (e) {
        enqueueSnackbar(String(e), { variant: "error" });
      }
    };
    loadProducts();
  }, [open]);

  const handleGenerate = () => {
    if (!linkedProduct) {
      enqueueSnackbar(t("giftCodes.selectStorageProduct"), { variant: "warning" });
      return;
    }
    if (!count || parseInt(count) < 1) {
      enqueueSnackbar(t("giftCodes.giftCodeQuantityHelp"), { variant: "warning" });
      return;
    }
    setGenerating(true);
    dispatch(
      createGiftCodes({
        count: parseInt(count),
        linked_product: parseInt(linkedProduct),
        product_qty: productQty !== "" ? parseInt(productQty) : 1,
      }),
    )
      .then((res) => {
        setGeneratedCodes((res.gift_codes || []).map((c) => c.code));
      })
      .catch((e) => enqueueSnackbar(String(e), { variant: "error" }))
      .finally(() => setGenerating(false));
  };

  const handleAccept = () => {
    if (generatedCodes.length > 0) {
      copyToClipboard(generatedCodes.join("\n"));
      onClose();
      onGenerated();
    } else {
      handleGenerate();
    }
  };

  const codesText = generatedCodes.join("\n");

  return (
    <DraggableDialog
      title={t("vas.generateGiftCode")}
      showActions
      showCancel
      okText={generatedCodes.length > 0 ? t("giftCodes.copyAndClose") : t("common:ok")}
      onAccept={handleAccept}
      loading={generating}
      dialogProps={{
        open,
        onClose,
        fullWidth: true,
        maxWidth: "sm",
      }}
    >
      <DialogContent>
        {generatedCodes.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <NoMarginHelperText>{t("giftCodes.generatedCodesDescription")}</NoMarginHelperText>
            <DenseFilledTextField
              multiline
              rows={8}
              value={codesText}
              slotProps={{ input: { readOnly: true } }}
              fullWidth
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <SettingForm title={t("vas.linkedProduct")} lgWidth={12}>
              <FormControl fullWidth>
                <DenseSelect
                  value={linkedProduct}
                  onChange={(e) => setLinkedProduct(e.target.value as string)}
                  required
                >
                  <SquareMenuItem value="" disabled>
                    <ListItemText primary={<em>{t("common:select")}</em>} />
                  </SquareMenuItem>
                  {products.map((p) => (
                    <SquareMenuItem key={p.id} value={p.id.toString()}>
                      <ListItemText
                        slotProps={{
                          primary: { variant: "body2" },
                        }}
                      >
                        {p.name}
                      </ListItemText>
                    </SquareMenuItem>
                  ))}
                </DenseSelect>
                <NoMarginHelperText>{t("giftCodes.giftCodeProductType")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <SettingForm title={t("vas.numberOfCodes")} lgWidth={12}>
              <FormControl fullWidth>
                <DenseFilledTextField required type="number" value={count} onChange={(e) => setCount(e.target.value)} />
                <NoMarginHelperText>{t("vas.numberOfCodesDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>

            <SettingForm title={t("vas.productQyt")} lgWidth={12}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  type="number"
                  value={productQty}
                  onChange={(e) => setProductQty(e.target.value)}
                />
                <NoMarginHelperText>{t("giftCodes.duratonTimesDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>
          </Box>
        )}
      </DialogContent>
    </DraggableDialog>
  );
};

const GiftCodes = ({ storageProductsConfig: _sp, groupProductsConfig: _gp }: GiftCodesProps) => {
  const { t } = useTranslation("dashboard");
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
  const { enqueueSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    perPage: 10,
    total: 0,
  });

  useEffect(() => {
    loadGiftCodes();
  }, [pagination.page, pagination.perPage]);

  useEffect(() => {
    (async () => {
      try {
        const [storageRes, groupRes] = await Promise.all([
          dispatch(listProducts({ page_size: 100, type: ProductType.StoragePack })),
          dispatch(listProducts({ page_size: 100, type: ProductType.Group })),
        ]);
        setProducts([...(storageRes.products || []), ...(groupRes.products || [])]);
      } catch (e) {
        enqueueSnackbar(String(e), { variant: "error" });
      }
    })();
  }, []);

  const loadGiftCodes = () => {
    setLoading(true);
    dispatch(
      listGiftCodes({
        page_size: pagination.perPage,
      }),
    )
      .then((res) => {
        setGiftCodes(res.gift_codes || []);
        setPagination((p) => ({ ...p, total: res.pagination?.total_items || 0 }));
      })
      .catch((e) => enqueueSnackbar(String(e), { variant: "error" }))
      .finally(() => setLoading(false));
  };

  const handleChangeRowsPerPage = (pageSize: number) => {
    setPagination({
      page: 1,
      perPage: pageSize,
      total: pagination.total,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? giftCodes.map((c) => c.id) : []);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const handleDelete = (ids: number[]) => {
    dispatch(confirmOperation(t("common:areYouSure")))
      .then(() => {
        setDeleting(true);
        dispatch(batchDeleteGiftCodes({ ids }))
          .then(() => {
            enqueueSnackbar(t("giftCodes.giftCodeDeleted"), { variant: "success" });
            setSelectedIds([]);
            loadGiftCodes();
          })
          .catch((e) => enqueueSnackbar(String(e), { variant: "error" }))
          .finally(() => setDeleting(false));
      })
      .catch(() => {});
  };

  const allSelected = giftCodes.length > 0 && selectedIds.length === giftCodes.length;
  const productById = new Map(products.map((p) => [p.id, p]));

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1}>
        <SecondaryButton variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          {t("giftCodes.generateGiftCodes")}
        </SecondaryButton>
        {selectedIds.length > 0 && (
          <SecondaryButton
            variant="contained"
            color="error"
            startIcon={<Delete />}
            disabled={deleting}
            onClick={() => handleDelete(selectedIds)}
          >
            {selectedIds.length}
          </SecondaryButton>
        )}
      </Stack>

      <StyledTableContainerPaper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <NoWrapCell sx={{ width: 40 }}>
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={selectedIds.length > 0 && !allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </NoWrapCell>
                <NoWrapCell>#</NoWrapCell>
                <NoWrapCell>{t("giftCodes.giftCodeProduct")}</NoWrapCell>
                <NoWrapCell>{t("giftCodes.giftCodeAmount")}</NoWrapCell>
                <NoWrapCell>{t("giftCodes.giftCode")}</NoWrapCell>
                <NoWrapCell>{t("giftCodes.giftCodeStatus")}</NoWrapCell>
                <NoWrapCell>{t("giftCodes.giftCodeUsedBy")}</NoWrapCell>
                <NoWrapCell align="right"></NoWrapCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {giftCodes.length === 0 && !loading && (
                <TableRow>
                  <NoWrapCell colSpan={8} align="center">
                    {t("giftCodes.noGiftCodes")}
                  </NoWrapCell>
                </TableRow>
              )}
              {giftCodes.map((code, index) => {
                const linkedProduct = code.props?.linked_product;
                const linkedName = linkedProduct != null ? productById.get(linkedProduct)?.name : undefined;
                return (
                  <TableRow key={code.id}>
                    <NoWrapCell sx={{ width: 40 }}>
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(code.id)}
                        onChange={(e) => handleSelectOne(code.id, e.target.checked)}
                      />
                    </NoWrapCell>
                    <NoWrapCell>{pagination.perPage * (pagination.page - 1) + index + 1}</NoWrapCell>
                    <NoWrapCell>{linkedName ?? (linkedProduct != null ? String(linkedProduct) : "-")}</NoWrapCell>
                    <NoWrapCell>{code.props?.product_qty ?? "-"}</NoWrapCell>
                    <NoWrapCell>{code.code}</NoWrapCell>
                    <NoWrapCell>
                      <GiftCodeStatusChip used={(code.used_by ?? 0) > 0} />
                    </NoWrapCell>
                    <NoWrapCell>{(code.used_by ?? 0) > 0 ? code.used_by : "-"}</NoWrapCell>
                    <NoWrapCell align="right">
                      <IconButton size="small" disabled={deleting} onClick={() => handleDelete([code.id])}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </NoWrapCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {pagination?.total > 0 && (
          <Box sx={{ px: 1 }}>
            <TablePagination
              totalItems={pagination.total}
              page={pagination.page}
              rowsPerPage={pagination.perPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onChange={(_, page) => setPagination({ ...pagination, page })}
            />
          </Box>
        )}
      </StyledTableContainerPaper>

      <GenerateGiftCodesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onGenerated={() => {
          enqueueSnackbar(t("giftCodes.giftCodesGenerated"), { variant: "success" });
          loadGiftCodes();
        }}
      />
    </Stack>
  );
};

export default GiftCodes;
