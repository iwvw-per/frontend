import { ThunkResponse, defaultOpts, send } from "./request.ts";
import { CommonMixin, User } from "./dashboard.ts";

// ---------- 类型定义 ----------

export enum ProductType {
  StoragePack = "storage_pack",
  Group = "group",
  Credit = "credit",
}

export enum OrderStatus {
  Unpaid = "unpaid",
  Paid = "paid",
  Fulfilled = "fulfilled",
  Failed = "failed",
}

export enum PaymentProvider {
  Alipay = "alipay",
  Wechat = "wechat",
  PayJS = "payjs",
  Custom = "custom",
  Credits = "credits",
}

export interface ProductProps {
  size?: number;
  duration_days?: number;
  group_id?: number;
  credit_amount?: number;
  description?: string[];
  price_credits?: number;
}

export interface GiftCodeProps {
  linked_product?: number;
  product_qty?: number;
}

export interface Product extends CommonMixin {
  name: string;
  type: ProductType;
  price: number;
  highlight: boolean;
  enabled: boolean;
  props?: ProductProps;
  hash_id?: string;
}

export interface GiftCode extends CommonMixin {
  code: string;
  props?: GiftCodeProps;
  used_by?: number;
  used_at?: string;
  user_codes?: number;
  hash_id?: string;
}

export interface Order extends CommonMixin {
  order_no: string;
  product_type: ProductType;
  product_id: number;
  quantity: number;
  amount: number;
  status: OrderStatus;
  provider?: PaymentProvider;
  content?: GiftCodeProps;
  user_orders?: number;
  edges?: {
    user?: User;
  };
  hash_id?: string;
  user_hash_id?: string;
}

// ---------- 列表响应 ----------

export interface ListProductResponse {
  pagination?: {
    page?: number;
    page_size?: number;
    total_items?: number;
    next_token?: string;
    is_cursor?: boolean;
  };
  products: Product[];
}

export interface ListGiftCodeResponse {
  pagination?: {
    page?: number;
    page_size?: number;
    total_items?: number;
    next_token?: string;
    is_cursor?: boolean;
  };
  gift_codes: GiftCode[];
}

export interface ListOrderResponse {
  pagination?: {
    page?: number;
    page_size?: number;
    total_items?: number;
    next_token?: string;
    is_cursor?: boolean;
  };
  orders: Order[];
}

// ---------- 请求体 ----------

export interface ListProductService {
  page_size: number;
  page_token?: string;
  type?: ProductType;
}

export interface UpsertProductService {
  id?: number;
  name: string;
  type: ProductType;
  price: number;
  highlight?: boolean;
  enabled?: boolean;
  props?: ProductProps;
}

export interface CreateGiftCodeService {
  count: number;
  linked_product?: number;
  product_qty?: number;
}

export interface ListGiftCodeService {
  page_size: number;
  page_token?: string;
  used_only?: boolean;
  unused_only?: boolean;
}

export interface BatchDeleteGiftCodeService {
  ids: number[];
}

export interface ListOrderService {
  page_size: number;
  page_token?: string;
  product_type?: ProductType;
}

export interface CleanupOrderService {
  status: OrderStatus;
  not_after?: string;
}

export interface AdjustCreditService {
  amount: number;
  reason?: string;
}

// ---------- 商品 ----------

export function listProducts(args: ListProductService): ThunkResponse<ListProductResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/product`,
        {
          method: "POST",
          data: args,
        },
        { ...defaultOpts },
      ),
    );
  };
}

export function createProduct(args: UpsertProductService): ThunkResponse<Product> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/product`,
        {
          method: "PUT",
          data: args,
        },
        { ...defaultOpts },
      ),
    );
  };
}

export function updateProduct(id: number, args: UpsertProductService): ThunkResponse<Product> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/product/${id}`,
        {
          method: "PUT",
          data: args,
        },
        { ...defaultOpts },
      ),
    );
  };
}

export function getProduct(id: number): ThunkResponse<Product> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/product/${id}`,
        {
          method: "GET",
        },
        { ...defaultOpts },
      ),
    );
  };
}

export function deleteProduct(id: number): ThunkResponse<void> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/product/${id}`,
        {
          method: "DELETE",
        },
        { ...defaultOpts },
      ),
    );
  };
}

// ---------- 兑换码 ----------

export function createGiftCodes(args: CreateGiftCodeService): ThunkResponse<ListGiftCodeResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/giftcode`,
        {
          method: "POST",
          data: args,
        },
        { ...defaultOpts },
      ),
    );
  };
}

export function listGiftCodes(args: ListGiftCodeService): ThunkResponse<ListGiftCodeResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/giftcode/list`,
        {
          method: "POST",
          data: args,
        },
        { ...defaultOpts },
      ),
    );
  };
}

export function batchDeleteGiftCodes(args: BatchDeleteGiftCodeService): ThunkResponse<void> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/giftcode/batch/delete`,
        {
          method: "POST",
          data: args,
        },
        { ...defaultOpts },
      ),
    );
  };
}

// ---------- 订单 ----------

export function listOrders(args: ListOrderService): ThunkResponse<ListOrderResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/payment`,
        {
          method: "POST",
          data: args,
        },
        { ...defaultOpts },
      ),
    );
  };
}

export function deleteOrder(id: number): ThunkResponse<void> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/payment/${id}`,
        {
          method: "DELETE",
        },
        { ...defaultOpts },
      ),
    );
  };
}

export function cleanupOrders(args: CleanupOrderService): ThunkResponse<void> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/payment/cleanup`,
        {
          method: "POST",
          data: args,
        },
        { ...defaultOpts },
      ),
    );
  };
}

// ---------- 积分 ----------

export function adjustCredit(uid: string, args: AdjustCreditService): ThunkResponse<User> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/user/${uid}/credits`,
        {
          method: "POST",
          data: args,
        },
        { ...defaultOpts },
      ),
    );
  };
}
