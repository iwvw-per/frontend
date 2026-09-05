import { AdminListService, ListStoragePolicyResponse, StoragePolicy } from "./dashboard.ts";
import { PolicyType } from "./explorer.ts";
import { ThunkResponse, defaultOpts, send } from "./request.ts";

// listPoliciesForLoadBalance returns all storage policies that can be bound as
// children of a load_balance policy. load_balance policies themselves are
// excluded to prevent infinite nesting.
export function listPoliciesForLoadBalance(): ThunkResponse<StoragePolicy[]> {
  return async (dispatch, _getState) => {
    const args: AdminListService = {
      page: 1,
      page_size: 1000,
      order_by: "id",
      order_direction: "asc",
    };
    const res = await dispatch(
      send<ListStoragePolicyResponse>(`/admin/policy`, { method: "POST", data: args }, { ...defaultOpts }),
    );
    return res.policies.filter((p) => p.type !== PolicyType.load_balance);
  };
}
