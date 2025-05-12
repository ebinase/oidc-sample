import { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

// データベースのラッパー
// 実態はセッションストレージにする

// rdbmsのようなものを作るためのRecord型
// users.[id]のような形でアクセスできる
type User = {
  id: string;
  name: string;
  picture: string;
  externalId: string;
  // UI上の表示用
  loginCount: number;
};
export type DBSchema = {
  users: Record<string, User>;
}

export const sessionOptions: SessionOptions = {
  cookieName: "temp-database",
  password: process.env.SESSION_PASSWORD!,
};

// iron-sessionを隠蔽するための型
type Database<T> = T & {
  /**
   * Encrypts the session data and sets the cookie.
   */
  readonly save: () => Promise<void>;
};

export async function getDB(): Promise<Database<DBSchema>> {
  const session = await getIronSession<DBSchema>(await cookies(), sessionOptions);
  if (!session.users) {
    session.users = {};
    await session.save();
  }
  return session as Database<DBSchema>;
}
