import { ThunkResponse, defaultOpts, send } from "./request.ts";
import { ProductType } from "./proVAS.ts";
import { User } from "./dashboard.ts";

export interface ShopProduct {
  id: number;
  name: string;
  type: ProductType;
  price: number;
  price_credits?: number;
  credit_amount?: number;
  storage_size?: number;
  duration_days?: number;
  group_id?: number;
  description?: string[];
  highlight: boolean;
  hash_id?: string;
}

export interface GetShopResponse {
  products: ShopProduct[];
  credit: number;
}

export interface RedeemGiftCodeResponse {
  product?: {
    name: string;
    type: ProductType;
  };
  user?: User;
}

export function getShop(): ThunkResponse<GetShopResponse> {
  return async (dispatch) => {
    return await dispatch(
      send(
        `/shop`,
        {
          method: "GET",
        },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function redeemGiftCode(code: string): ThunkResponse<RedeemGiftCodeResponse> {
  return async (dispatch) => {
    return await dispatch(
      send(
        `/payment/redeem`,
        {
          method: "POST",
          data: { code },
        },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}
