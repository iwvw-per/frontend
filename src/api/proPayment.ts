import { ThunkResponse, defaultOpts, send } from "./request.ts";
import { Order, PaymentProvider, ProductType } from "./proVAS.ts";

// ---------- 回调 URL 生成 ----------

/** 各支付渠道异步通知回调地址。 */
export function buildAlipayCallbackURL(): string {
  return "/api/v4/payment/callback/alipay";
}

export function buildWechatCallbackURL(): string {
  return "/api/v4/payment/callback/wechat";
}

export function buildPayJSCallbackURL(): string {
  return "/api/v4/payment/callback/payjs";
}

export function buildCustomCallbackURL(): string {
  return "/api/v4/payment/callback/custom";
}

/** 按支付渠道返回对应的回调地址。 */
export function buildPaymentCallbackURL(provider: PaymentProvider): string {
  switch (provider) {
    case PaymentProvider.Alipay:
      return buildAlipayCallbackURL();
    case PaymentProvider.Wechat:
      return buildWechatCallbackURL();
    case PaymentProvider.PayJS:
      return buildPayJSCallbackURL();
    case PaymentProvider.Custom:
      return buildCustomCallbackURL();
    default:
      return buildCustomCallbackURL();
  }
}

// ---------- 下单 ----------

export interface CreateOrderService {
  product_id: number;
  product_type: ProductType;
  quantity?: number;
  provider?: PaymentProvider;
}

export function createOrder(args: CreateOrderService): ThunkResponse<Order> {
  return async (dispatch) => {
    return await dispatch(
      send(
        `/payment/order`,
        {
          method: "POST",
          data: args,
        },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}
