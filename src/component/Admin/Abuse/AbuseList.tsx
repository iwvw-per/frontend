import { Delete } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { batchDeleteAbuseReports, getAbuseReportList, updateAbuseReportStatus } from "../../../api/proAbuse";
import { AbuseReport, AbuseStatus } from "../../../api/proAbuse";
import { AdminListService } from "../../../api/dashboard";
import { useAppDispatch } from "../../../redux/hooks";
import { confirmOperation } from "../../../redux/thunks/dialog";
import { NoWrapTableCell, SecondaryButton, StyledTableContainerPaper } from "../../Common/StyledComponents";
import ArrowSync from "../../Icons/ArrowSync";
import PageContainer from "../../Pages/PageContainer";
import PageHeader from "../../Pages/PageHeader";
import TablePagination from "../Common/TablePagination";
import { OrderDirectionQuery, PageQuery, PageSizeQuery } from "../StoragePolicy/StoragePolicySetting";

export const StatusQuery = "status";

const AbuseList = () => {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [page, setPage] = useQueryState(PageQuery, { defaultValue: "1" });
  const [pageSize, setPageSize] = useQueryState(PageSizeQuery, { defaultValue: "10" });
  const [status, setStatus] = useQueryState(StatusQuery, { defaultValue: "" });

  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageInt = parseInt(page) ?? 1;
  const pageSizeInt = parseInt(pageSize) ?? 10;

  useEffect(() => {
    fetchReports();
  }, [page, pageSize, status]);

  const fetchReports = () => {
    setLoading(true);
    setSelected([]);

    const params: AdminListService = {
      page: pageInt,
      page_size: pageSizeInt,
      order_by: "id",
      order_direction: "desc",
      conditions: {
        status,
      },
    };

    dispatch(getAbuseReportList(params))
      .then((res) => {
        setReports((res.reports ?? []).map((r) => r.report).filter((r): r is AbuseReport => !!r));
        setPageSize((res.pagination?.page_size ?? pageSizeInt).toString());
        setCount(res.pagination?.total_items ?? 0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleMarkStatus = (id: number, nextStatus: AbuseStatus) => {
    dispatch(updateAbuseReportStatus(id, { status: nextStatus })).then(() => {
      fetchReports();
    });
  };

  const handleDelete = () => {
    setDeleteLoading(true);
    dispatch(confirmOperation(t("abuseReport.confirmBatchDelete", { num: selected.length })))
      .then(() => {
        dispatch(batchDeleteAbuseReports({ ids: Array.from(selected) })).then(() => {
          fetchReports();
        });
      })
      .finally(() => {
        setDeleteLoading(false);
      });
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(reports.map((n) => n.id));
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

  const statusColor = (s: AbuseStatus) => {
    switch (s) {
      case AbuseStatus.resolved:
        return "success";
      case AbuseStatus.ignored:
        return "default";
      default:
        return "warning";
    }
  };

  return (
    <PageContainer>
      <Container maxWidth="xl">
        <PageHeader title={t("nav.abuseReport")} />
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <SecondaryButton onClick={fetchReports} disabled={loading} variant={"contained"} startIcon={<ArrowSync />}>
            {t("node.refresh")}
          </SecondaryButton>

          {selected.length > 0 && !isMobile && (
            <>
              <Divider orientation="vertical" flexItem />
              <Button startIcon={<Delete />} variant="contained" color="error" onClick={handleDelete}>
                {t("abuseReport.deleteXAbuseReports", { num: selected.length })}
              </Button>
            </>
          )}
        </Stack>
        {isMobile && selected.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button startIcon={<Delete />} variant="contained" color="error" onClick={handleDelete}>
              {t("abuseReport.deleteXAbuseReports", { num: selected.length })}
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
                    indeterminate={selected.length > 0 && selected.length < reports.length}
                    checked={reports.length > 0 && selected.length === reports.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <NoWrapTableCell width={60}>{t("group.#")}</NoWrapTableCell>
                <NoWrapTableCell width={120}>{t("abuseReport.reporter")}</NoWrapTableCell>
                <NoWrapTableCell width={120}>{t("abuseReport.reportedUserID")}</NoWrapTableCell>
                <NoWrapTableCell width={120}>{t("abuseReport.shareID")}</NoWrapTableCell>
                <NoWrapTableCell width={150}>{t("abuseReport.folderPath")}</NoWrapTableCell>
                <NoWrapTableCell width={150}>{t("abuseReport.reason")}</NoWrapTableCell>
                <NoWrapTableCell width={100}>{t("user.status")}</NoWrapTableCell>
                <NoWrapTableCell width={150}>{t("file.createdAt")}</NoWrapTableCell>
                <NoWrapTableCell width={160}></NoWrapTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                reports.map((report) => (
                  <TableRow hover key={report.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        color="primary"
                        checked={selected.indexOf(report.id) !== -1}
                        onChange={() => handleSelect(report.id)}
                      />
                    </TableCell>
                    <NoWrapTableCell>{report.id}</NoWrapTableCell>
                    <NoWrapTableCell>{report.edges?.reporter?.nick ?? t("abuseReport.deletedUser")}</NoWrapTableCell>
                    <NoWrapTableCell>{report.edges?.reported?.nick ?? t("abuseReport.deletedUser")}</NoWrapTableCell>
                    <NoWrapTableCell>{report.edges?.share ? `#${report.edges.share.id}` : "-"}</NoWrapTableCell>
                    <NoWrapTableCell>{report.folder_path || "-"}</NoWrapTableCell>
                    <NoWrapTableCell>{report.reason || "-"}</NoWrapTableCell>
                    <NoWrapTableCell>
                      <Chip
                        size="small"
                        label={report.status}
                        color={statusColor(report.status) as "default" | "success" | "warning"}
                      />
                    </NoWrapTableCell>
                    <NoWrapTableCell>{report.created_at}</NoWrapTableCell>
                    <NoWrapTableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          disabled={report.status === AbuseStatus.resolved}
                          onClick={() => handleMarkStatus(report.id, AbuseStatus.resolved)}
                        >
                          {t("abuseReport.resolved")}
                        </Button>
                        <Button
                          size="small"
                          disabled={report.status === AbuseStatus.ignored}
                          onClick={() => handleMarkStatus(report.id, AbuseStatus.ignored)}
                        >
                          {t("abuseReport.ignored")}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={deleteLoading}
                          onClick={() => {
                            dispatch(confirmOperation(t("abuseReport.confirmDelete"))).then(() => {
                              dispatch(batchDeleteAbuseReports({ ids: [report.id] })).then(() => fetchReports());
                            });
                          }}
                        >
                          <Delete fontSize="small" />
                        </Button>
                      </Stack>
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
    </PageContainer>
  );
};

export default AbuseList;
