import { FileAccessRule, FileResponse } from "./explorer.ts";
import { defaultOpts, send, ThunkResponse } from "./request.ts";

export interface SetFilePermissionService {
  uri: string;
  allow_users?: number[];
  deny_users?: number[];
  allow_groups?: number[];
  deny_groups?: number[];
  anonymous?: number;
}

export const AnonymousAccessLevel = {
  inherit: 0,
  view: 1,
  download: 2,
  write: 3,
} as const;

export function setFilePermission(args: SetFilePermissionService): ThunkResponse<FileResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/file/permission`,
        { method: "PATCH", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}
