import { getUserPolicies } from "../../api/proPolicy.ts";
import { setPolicyOptionCache } from "../globalStateSlice.ts";
import { AppThunk } from "../store.ts";

export function loadPolicyOptionCache(force = false): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const current = getState().globalState.policyOptionCache;
    if (!force && current && current.length > 0) {
      return;
    }

    const list = await dispatch(getUserPolicies());
    dispatch(setPolicyOptionCache(list ?? []));
  };
}
