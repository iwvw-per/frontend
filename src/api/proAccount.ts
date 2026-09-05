import SessionManager, { Session } from "../session";
import { User } from "./user.ts";

/**
 * 多账号切换相关辅助/接口（PRO）。
 *
 * 多账号切换基于「前端本地多 token 管理」：每个账号登录后签发独立的 token 对，
 * 由 sessionManager 在本地保存多份，切换时只改写当前的 active token（即
 * Authorization 头），后端鉴权核心无侵入、各 token 互不覆盖。
 */

export interface ProAccountSummary {
  user_id: number;
  id: string;
  nickname: string;
  email: string;
}

export interface ProAccountItem {
  uid: string;
  user: User | undefined;
  session: Session;
  isCurrent: boolean;
}

// 列出本地已保存（未登出）的账号
export const listSavedAccounts = (): ProAccountItem[] => {
  const current = SessionManager.currentLoginOrNull();
  return SessionManager.listAccounts().map((session) => ({
    uid: session.user.id,
    user: session.user,
    session,
    isCurrent: !!current && current.user.id === session.user.id,
  }));
};

// 切换当前账号，返回切换后的会话
export const switchAccount = (uid: string): Session => {
  return SessionManager.switchAccount(uid);
};

// 退出指定账号，返回退出后仍处于当前态的账号 uid（可能为空）
export const signOutAccount = (uid: string): string | undefined => {
  return SessionManager.signOutAccount(uid);
};

// 跳转登录页以新增账号（新增后登录流程会调用 sessionManager.upsert 使之为当前账号）
export const addAccount = (): void => {
  window.location.href = "/session";
};
