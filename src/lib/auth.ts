/**
 * Local-only accounts.
 *
 * A username and password stored in this browser — hashed with PBKDF2, never
 * sent anywhere. There is no server to sign in to.
 */

import { useEffect, useState } from "react";
import { findUser, getUserById, insertUser, uid, type LocalUser } from "@/lib/localdb";

const SESSION_KEY = "explyn:session";
const AUTH_EVENT = "explyn:auth-changed";

export interface SessionUser {
  id: string;
  username: string;
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 120000, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

function emitChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!getUserById(parsed.id)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setSession(user: LocalUser) {
  const session: SessionUser = { id: user.id, username: user.username };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emitChange();
  return session;
}

export async function signUp(username: string, password: string): Promise<SessionUser> {
  const name = username.trim();
  if (name.length < 3) throw new Error("Choose a username with at least 3 characters.");
  if (password.length < 6) throw new Error("Choose a password with at least 6 characters.");
  if (findUser(name)) throw new Error("That username is already taken on this device.");

  const salt = uid();
  const hash = await hashPassword(password, salt);
  const user = insertUser({
    id: uid(),
    username: name,
    salt,
    hash,
    created_at: new Date().toISOString(),
  });
  return setSession(user);
}

export async function signIn(username: string, password: string): Promise<SessionUser> {
  const user = findUser(username);
  if (!user) throw new Error("No account with that username on this device.");
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.hash) throw new Error("Wrong password.");
  return setSession(user);
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  emitChange();
}

export function hasAnyAccount() {
  return Boolean(localStorage.getItem("explyn:db:v1")?.includes('"users"'));
}

/** React hook — re-renders whenever the local session changes. */
export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(() => getSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getSession());
    setLoading(false);
    const sync = () => setUser(getSession());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, loading, signOut };
}
