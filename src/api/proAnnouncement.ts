import { defaultOpts, send, ThunkResponse } from "./request.ts";

export interface Announcement {
  enabled: boolean;
  content: string;
  updated_at?: string;
}

export interface UpdateAnnouncementService {
  enabled: boolean;
  content: string;
}

export function getAnnouncement(): ThunkResponse<Announcement> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/announcement`,
        { method: "GET" },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function updateAnnouncement(args: UpdateAnnouncementService): ThunkResponse<Announcement> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/admin/announcement`,
        { method: "PUT", data: args },
        {
          ...defaultOpts,
        },
      ),
    );
  };
}

export function getPublicAnnouncement(): ThunkResponse<Announcement> {
  return async (dispatch, _getState) => {
    return await dispatch(
      send(
        `/site/announcement`,
        { method: "GET" },
        {
          ...defaultOpts,
          noCredential: true,
        },
      ),
    );
  };
}
