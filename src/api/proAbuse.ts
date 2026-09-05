import { defaultOpts, send, ThunkResponse } from "./request.ts";
import { AdminListService, User, Share } from "./dashboard.ts";
import { PaginationResults } from "./explorer.ts";

export enum AbuseStatus {
  pending = "pending",
  resolved = "resolved",
  ignored = "ignored",
}

export interface AbuseReport {
  id: number;
  created_at?: string;
  updated_at?: string;
  folder_path?: string;
  reason?: string;
  description?: string;
  status: AbuseStatus;
  edges?: {
    reporter?: User;
    reported?: User;
    share?: Share;
  };
}

export interface AbuseReportResponse {
  report?: AbuseReport;
  reporter_hash_id?: string;
  reported_hash_id?: string;
  share_hash_id?: string;
}

export interface ListAbuseReportResponse {
  reports?: AbuseReportResponse[];
  pagination?: PaginationResults;
}

export interface UpdateAbuseReportService {
  status: AbuseStatus;
}

export interface BatchAbuseReportService {
  ids: number[];
}

export interface CreateAbuseReportService {
  reason?: string;
  description?: string;
}

export function getAbuseReportList(args: AdminListService): ThunkResponse<ListAbuseReportResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/abuse`,
        { method: "POST", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function getAbuseReportDetail(id: number): ThunkResponse<AbuseReportResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/abuse/${id}`,
        { method: "GET" },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function updateAbuseReportStatus(
  id: number,
  args: UpdateAbuseReportService,
): ThunkResponse<AbuseReportResponse> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/abuse/${id}`,
        { method: "PATCH", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function batchDeleteAbuseReports(args: BatchAbuseReportService): ThunkResponse<void> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/abuse/batch/delete`,
        { method: "POST", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function reportShare(id: string, args: CreateAbuseReportService): ThunkResponse<void> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/share/report/${id}`,
        { method: "POST", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}
