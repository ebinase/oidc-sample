import { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  user?: {
    id: string;
    name: string;
    picture: string;
  };
  auth?: {
    state: string; // CSRF対策のためのstate
    code_verifier: string; // PKCE(+CSRF対策)のためのcode_verifier
    nonce: string; // OIDCのnonce
  };
};

export const sessionOptions: SessionOptions = {
  cookieName: process.env.SESSION_COOKIE_NAME!,
  password: process.env.SESSION_PASSWORD!,
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
