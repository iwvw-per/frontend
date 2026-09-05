import { FileResponse, StoragePolicy } from "./explorer.ts";
import { defaultOpts, send, ThunkResponse } from "./request.ts";

// 用户侧可用的存储策略。id 为 hashid（用于上传时通过 policy_id 指定），
// storage_policy_id 为原始数据库 ID（用于设置目录偏好策略）。
export interface UserPolicy extends Omit<StoragePolicy, "id"> {
  id: string;
  storage_policy_id: number;
}

export interface SetFilePolicyService {
  uri: string;
  storage_policy_id: number;
}

export function getUserPolicies(): ThunkResponse<UserPolicy[]> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/user/policies`,
        { method: "GET" },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function setFilePolicy(args: SetFilePolicyService): ThunkResponse<FileResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/file/policy`,
        { method: "PATCH", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}
