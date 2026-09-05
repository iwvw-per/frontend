import { AxiosProgressEvent } from "axios";
import { FileResponse } from "./explorer.ts";
import { defaultOpts, send, ThunkResponse } from "./request.ts";

export interface ShareCollabFileResponse extends FileResponse {}

export interface BuyShareResponse {
  purchased: boolean;
  price: number;
  credit: number;
}

export interface ShareBuyService {}

/**
 * 经分享链接上传文件（单请求，body 为文件原始内容，目标路径由 uri 指定）。
 */
export function uploadToShare(
  shareId: string,
  uri: string,
  data: Blob,
  onUploadProgress?: (e: AxiosProgressEvent) => void,
): ThunkResponse<FileResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/share/upload/${shareId}`,
        {
          data,
          params: { uri, last_modified: Math.floor(Date.now()) },
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          onUploadProgress,
        },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

/**
 * 经分享链接重命名分享内文件。
 */
export function renameInShare(shareId: string, uri: string, newName: string): ThunkResponse<FileResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/share/modify/${shareId}`,
        {
          data: {},
          params: { uri, new_name: newName },
          method: "POST",
        },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

/**
 * 经分享链接更新分享内文件内容（body 为文件新内容）。
 */
export function updateShareFileContent(
  shareId: string,
  uri: string,
  data: Blob,
  onUploadProgress?: (e: AxiosProgressEvent) => void,
): ThunkResponse<FileResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/share/modify/${shareId}`,
        {
          data,
          params: { uri },
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          onUploadProgress,
        },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

/**
 * 经分享链接删除分享内文件。
 */
export function deleteFromShare(shareId: string, uris: string[]): ThunkResponse<void> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/share/file/${shareId}`,
        {
          data: { uris },
          method: "DELETE",
        },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

/**
 * 用积分购买付费分享的访问权。
 */
export function buyShare(shareId: string): ThunkResponse<BuyShareResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/share/buy/${shareId}`,
        {
          data: {},
          method: "POST",
        },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}
