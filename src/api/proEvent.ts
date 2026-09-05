import { AdminListService, AuditLog, BatchIDService, ListAuditLogResponse } from "./dashboard.ts";
import { defaultOpts, send, ThunkResponse } from "./request.ts";

export interface CleanupEventService {
  not_after: string;
  types?: number[];
}

export function getAuditLogs(args: AdminListService): ThunkResponse<ListAuditLogResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/event`,
        { method: "POST", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function getAuditLogDetail(id: number): ThunkResponse<AuditLog> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/event/${id}`,
        { method: "GET" },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function cleanupAuditLogs(args: CleanupEventService): ThunkResponse<void> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/event/cleanup`,
        { method: "POST", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function batchDeleteAuditLogs(args: BatchIDService): ThunkResponse<void> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/event/batch/delete`,
        { method: "POST", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}
