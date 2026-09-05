import { Delete } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  ListItemText,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Close from "@mui/icons-material/Close";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { batchDeleteAuditLogs, cleanupAuditLogs, getAuditLogs } from "../../../api/proEvent";
import { AdminListService, AuditLog, BatchIDService } from "../../../api/dashboard";
import { AuditLogType } from "../../../api/explorer";
import { useAppDispatch } from "../../../redux/hooks";
import { confirmOperation } from "../../../redux/thunks/dialog";
import {
  DenseSelect,
  NoWrapTableCell,
  SecondaryButton,
  SquareChip,
  StyledTableContainerPaper,
} from "../../Common/StyledComponents";
import { DefaultCloseAction } from "../../Common/Snackbar/snackbar";
import { SquareMenuItem } from "../../FileManager/ContextMenu/ContextMenu";
import ArrowSync from "../../Icons/ArrowSync";
import Broom from "../../Icons/Broom";
import PageContainer from "../../Pages/PageContainer";
import PageHeader from "../../Pages/PageHeader";
import DraggableDialog from "../../Dialogs/DraggableDialog";
import SettingForm from "../../Pages/Setting/SettingForm";
import { NoMarginHelperText } from "../Settings/Settings";
import TablePagination from "../Common/TablePagination";
import { OrderDirectionQuery, PageQuery, PageSizeQuery } from "../StoragePolicy/StoragePolicySetting";
import { getEventName } from "../Settings/Event/Events";

const EventList = () => {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useQueryState(PageQuery, { defaultValue: "1" });
  const [pageSize, setPageSize] = useQueryState(PageSizeQuery, { defaultValue: "10" });
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detail, setDetail] = useState<AuditLog | undefined>(undefined);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupNotAfter, setCleanupNotAfter] = useState<dayjs.Dayjs | null>(null);
  const [cleanupTypes, setCleanupTypes] = useState<number[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const pageInt = parseInt(page) ?? 1;
  const pageSizeInt = parseInt(pageSize) ?? 10;

  const typeName = useMemo(() => {
    return (type?: number) =>
      type === undefined ? "-" : t(`settings.event.${getEventName(type)}`, getEventName(type));
  }, [t]);

  const eventTypes = useMemo(() => {
    return Object.entries(AuditLogType).map(([name, value]) => ({ name, value }));
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  const fetchLogs = () => {
    setLoading(true);
    setSelected([]);

    const params: AdminListService = {
      page: pageInt,
      page_size: pageSizeInt,
      order_by: "id",
      order_direction: "desc",
    };

    dispatch(getAuditLogs(params))
      .then((res) => {
        setLogs(res.logs ?? []);
        setPageSize((res.pagination?.page_size ?? pageSizeInt).toString());
        setCount(res.pagination?.total_items ?? 0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = () => {
    setDeleteLoading(true);
    const ids = Array.from(selected);
    const service: BatchIDService = { ids };
    dispatch(confirmOperation(t("event.confirmBatchDelete", { num: ids.length })))
      .then(() => {
        dispatch(batchDeleteAuditLogs(service)).then(() => fetchLogs());
      })
      .finally(() => {
        setDeleteLoading(false);
      });
  };

  const handleCleanup = () => {
    if (!cleanupNotAfter) {
      return;
    }
    setCleanupLoading(true);
    dispatch(
      cleanupAuditLogs({
        not_after: cleanupNotAfter.toISOString(),
        types: cleanupTypes.length > 0 ? cleanupTypes : undefined,
      }),
    )
      .then(() => {
        enqueueSnackbar({
          message: t("event.cleanupSuccess", "Events cleaned up."),
          variant: "success",
          action: DefaultCloseAction,
        });
        setCleanupOpen(false);
        setCleanupNotAfter(null);
        setCleanupTypes([]);
        fetchLogs();
      })
      .finally(() => {
        setCleanupLoading(false);
      });
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(logs.map((n) => n.id));
      return;
    }
    setSelected([]);
  };

  const handleSelect = (id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  return (
    <PageContainer>
      <Container maxWidth="xl">
        <PageHeader title={t("nav.events")} />
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <SecondaryButton onClick={fetchLogs} disabled={loading} variant={"contained"} startIcon={<ArrowSync />}>
            {t("node.refresh")}
          </SecondaryButton>

          <SecondaryButton variant={"contained"} startIcon={<Broom />} onClick={() => setCleanupOpen(true)}>
            {t("event.cleanup")}
          </SecondaryButton>

          {selected.length > 0 && !isMobile && (
            <>
              <Divider orientation="vertical" flexItem />
              <Button
                startIcon={<Delete />}
                variant="contained"
                color="error"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {t("event.deleteXEvents", { num: selected.length })}
              </Button>
            </>
          )}
        </Stack>
        {isMobile && selected.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              startIcon={<Delete />}
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {t("event.deleteXEvents", { num: selected.length })}
            </Button>
          </Stack>
        )}
        <TableContainer component={StyledTableContainerPaper} sx={{ mt: 2 }}>
          <Table size="small" stickyHeader sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ width: "36px!important" }} width={50}>
                  <Checkbox
                    size="small"
                    indeterminate={selected.length > 0 && selected.length < logs.length}
                    checked={logs.length > 0 && selected.length === logs.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <NoWrapTableCell width={60}>{t("group.#")}</NoWrapTableCell>
                <NoWrapTableCell width={180}>{t("event.event")}</NoWrapTableCell>
                <NoWrapTableCell width={120}>{t("event.initiator")}</NoWrapTableCell>
                <NoWrapTableCell width={120}>{t("event.ip")}</NoWrapTableCell>
                <NoWrapTableCell width={150}>{t("file.createdAt")}</NoWrapTableCell>
                <NoWrapTableCell width={100}></NoWrapTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                logs.map((log) => (
                  <TableRow hover key={log.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        color="primary"
                        checked={selected.indexOf(log.id) !== -1}
                        onChange={() => handleSelect(log.id)}
                      />
                    </TableCell>
                    <NoWrapTableCell>{log.id}</NoWrapTableCell>
                    <NoWrapTableCell>
                      <Chip size="small" label={typeName(log.type)} />
                    </NoWrapTableCell>
                    <NoWrapTableCell>{log.edges?.user?.nick ?? "-"}</NoWrapTableCell>
                    <NoWrapTableCell>{log.ip || "-"}</NoWrapTableCell>
                    <NoWrapTableCell>{log.created_at}</NoWrapTableCell>
                    <NoWrapTableCell>
                      <Button size="small" onClick={() => setDetail(log)}>
                        {t("event.eventDialogTitle")}
                      </Button>
                    </NoWrapTableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        {count > 0 && (
          <Box sx={{ mt: 1 }}>
            <TablePagination
              page={pageInt}
              totalItems={count}
              rowsPerPage={pageSizeInt}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onRowsPerPageChange={(value) => setPageSize(value.toString())}
              onChange={(_, value) => setPage(value.toString())}
            />
          </Box>
        )}
      </Container>

      <Dialog open={!!detail} onClose={() => setDetail(undefined)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {detail ? typeName(detail.type) : ""}
          <IconButton size="small" onClick={() => setDetail(undefined)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Stack spacing={1}>
              <Typography variant="body2">
                <b>{t("event.initiator")}:</b> {detail.edges?.user?.nick ?? "-"} ({detail.user_hash_id ?? "-"})
              </Typography>
              <Typography variant="body2">
                <b>{t("event.ip")}:</b> {detail.ip || "-"}
              </Typography>
              <Typography variant="body2">
                <b>{t("event.correlationId")}:</b> {detail.correlation_id || "-"}
              </Typography>
              <Typography variant="body2">
                <b>{t("file.createdAt")}:</b> {detail.created_at}
              </Typography>
              {detail.content && (
                <>
                  <Divider />
                  <Typography variant="body2">
                    <b>{t("event.rawContent")}:</b>
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {JSON.stringify(detail.content, null, 2)}
                  </Typography>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <DraggableDialog
        title={t("event.cleanupAuditLog")}
        dialogProps={{
          open: cleanupOpen,
          onClose: () => setCleanupOpen(false),
          maxWidth: "sm",
          fullWidth: true,
        }}
        showActions
        showCancel
        onAccept={handleCleanup}
        loading={cleanupLoading}
        disabled={!cleanupNotAfter}
        okText={t("event.cleanup")}
      >
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              {t("event.cleanupAuditLogDescription")}
            </Typography>

            <SettingForm title={t("event.cleanupNotAfter")} noContainer lgWidth={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  value={cleanupNotAfter}
                  onChange={(newValue) => setCleanupNotAfter(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                />
              </LocalizationProvider>
            </SettingForm>

            <SettingForm title={t("event.cleanupEventTypes")} noContainer lgWidth={12}>
              <DenseSelect
                fullWidth
                multiple
                value={cleanupTypes}
                onChange={(e: SelectChangeEvent<unknown>) => setCleanupTypes(e.target.value as number[])}
                displayEmpty
                renderValue={(selected) => {
                  const values = (Array.isArray(selected) ? selected : []) as number[];
                  if (values.length === 0) {
                    return (
                      <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
                        {t("event.allEventTypes")}
                      </Typography>
                    );
                  }
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {values.map((value) => (
                        <SquareChip key={value} size="small" label={typeName(value)} />
                      ))}
                    </Box>
                  );
                }}
              >
                {eventTypes.map(({ value }) => (
                  <SquareMenuItem value={value} key={value}>
                    <ListItemText slotProps={{ primary: { variant: "body2" } }}>{typeName(value)}</ListItemText>
                  </SquareMenuItem>
                ))}
              </DenseSelect>
              <NoMarginHelperText>{t("event.cleanupEventTypesDes")}</NoMarginHelperText>
            </SettingForm>
          </Stack>
        </DialogContent>
      </DraggableDialog>
    </PageContainer>
  );
};

export default EventList;
