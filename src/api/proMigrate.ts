import { defaultOpts, send, ThunkResponse } from "./request.ts";
import { TaskResponse } from "./workflow.ts";

export interface RelocateWorkflowService {
  src_uri: string;
  target_policy_id: number;
  recursive?: boolean;
}

export function createRelocateTask(req: RelocateWorkflowService): ThunkResponse<TaskResponse> {
  return async (dispatch) => {
    return await dispatch(
      send(
        "/workflow/relocate",
        {
          data: req,
          method: "POST",
        },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}
