import { defaultOpts, send, ThunkResponse } from "./request.ts";

/** A node the current user is allowed to select for background tasks. */
export interface ProUserNode {
  id: number;
  name: string;
}

export interface ProUserNodesResponse {
  nodes: ProUserNode[];
}

/** Dispatchable thunk: fetch the current user's selectable nodes. */
export function getUserNodes(): ThunkResponse<ProUserNodesResponse> {
  return async (dispatch) => {
    return await dispatch(send(`/user/nodes`, { method: "GET" }, { ...defaultOpts }));
  };
}
