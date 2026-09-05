import { Delete } from "@mui/icons-material";
import {
  Box,
  Button,
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
import { deleteOrder, listOrders, Order, OrderStatus } from "../../../api/proVAS";
import { useAppDispatch } from "../../../redux/hooks";
import { confirmOperation } from "../../../redux/thunks/dialog";
import { NoWrapTableCell, SecondaryButton, StyledTableContainerPaper } from "../../Common/StyledComponents";
import ArrowSync from "../../Icons/ArrowSync";
import PageContainer from "../../Pages/PageContainer";
import PageHeader from "../../Pages/PageHeader";
import TablePagination from "../Common/TablePagination";
import { PageQuery, PageSizeQuery } from "../StoragePolicy/StoragePolicySetting";

const PaymentList = () => {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useQueryState(PageQuery, { defaultValue: "1" });
  const [pageSize, setPageSize] = useQueryState(PageSizeQuery, { defaultValue: "10" });
  const [count, setCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageInt = parseInt(page) ?? 1;
  const pageSizeInt = parseInt(pageSize) ?? 10;

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize]);

  const fetchOrders = () => {
    setLoading(true);
    dispatch(listOrders({ page_size: pageSizeInt }))
      .then((res) => {
        setOrders(res.orders ?? []);
        setPageSize((res.pagination?.page_size ?? pageSizeInt).toString());
        setCount(res.pagination?.total_items ?? 0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = (id: number) => {
    setDeleteLoading(true);
    dispatch(confirmOperation(t("vas.confirmDelete"))).then(() => {
      dispatch(deleteOrder(id)).then(() => fetchOrders());
      setDeleteLoading(false);
    });
  };

  const statusColor = (s: OrderStatus) => {
    switch (s) {
      case OrderStatus.Paid:
        return "info";
      case OrderStatus.Fulfilled:
        return "success";
      case OrderStatus.Failed:
        return "error";
      default:
        return "default";
    }
  };

  return (
    <PageContainer>
      <Container maxWidth="xl">
        <PageHeader title={t("vas.orders")} />
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <SecondaryButton onClick={fetchOrders} disabled={loading} variant={"contained"} startIcon={<ArrowSync />}>
            {t("node.refresh")}
          </SecondaryButton>
        </Stack>
        <TableContainer component={StyledTableContainerPaper} sx={{ mt: 2 }}>
          <Table size="small" stickyHeader sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <NoWrapTableCell width={60}>{t("group.#")}</NoWrapTableCell>
                <NoWrapTableCell width={180}>{t("payment.tradeNo")}</NoWrapTableCell>
                <NoWrapTableCell width={120}>{t("payment.productType")}</NoWrapTableCell>
                <NoWrapTableCell width={100}>{t("vas.qyt")}</NoWrapTableCell>
                <NoWrapTableCell width={120}>{t("vas.price")}</NoWrapTableCell>
                <NoWrapTableCell width={100}>{t("payment.providerID")}</NoWrapTableCell>
                <NoWrapTableCell width={100}>{t("payment.status")}</NoWrapTableCell>
                <NoWrapTableCell width={150}>{t("file.createdAt")}</NoWrapTableCell>
                <NoWrapTableCell width={100}></NoWrapTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                orders.map((order) => (
                  <TableRow hover key={order.id}>
                    <NoWrapTableCell>{order.id}</NoWrapTableCell>
                    <NoWrapTableCell>{order.order_no}</NoWrapTableCell>
                    <NoWrapTableCell>{order.product_type}</NoWrapTableCell>
                    <NoWrapTableCell>{order.quantity}</NoWrapTableCell>
                    <NoWrapTableCell>{order.amount}</NoWrapTableCell>
                    <NoWrapTableCell>{order.provider || "-"}</NoWrapTableCell>
                    <NoWrapTableCell>
                      <Chip
                        size="small"
                        label={order.status}
                        color={statusColor(order.status) as "default" | "info" | "success" | "error"}
                      />
                    </NoWrapTableCell>
                    <NoWrapTableCell>{order.created_at}</NoWrapTableCell>
                    <NoWrapTableCell>
                      {!isMobile && (
                        <Button
                          size="small"
                          color="error"
                          disabled={deleteLoading}
                          onClick={() => handleDelete(order.id)}
                        >
                          <Delete fontSize="small" />
                        </Button>
                      )}
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

export default PaymentList;
