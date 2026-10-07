import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import {
  ONLINE_FUNCTION_NAME,
  type OnlineRequest,
  type OnlineResponse,
  type OnlineRoom,
} from "./protocol";

// Set in .env / EAS environment variables. Both are public values (the
// publishable or legacy anon key), but they stay out of git like the
// AdMob IDs.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "";

export const isOnlineConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;

let client: SupabaseClient | null = null;

// Created lazily so the static web export never touches storage.
export function getSupabase(): SupabaseClient {
  if (!isOnlineConfigured) {
    throw new Error("Online play is not configured");
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storage: Platform.OS === "web" ? undefined : AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

// Online play needs no account: each device signs in anonymously once and
// keeps that session.
export async function ensureSignedIn(): Promise<string> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return data.session.user.id;
  }
  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error || !signedIn.user) {
    throw new Error("オンラインに接続できませんでした。");
  }
  return signedIn.user.id;
}

export async function callOnline(
  request: OnlineRequest,
): Promise<OnlineRoom | null> {
  const { data, error } = await getSupabase().functions.invoke<OnlineResponse>(
    ONLINE_FUNCTION_NAME,
    { body: request },
  );

  // Errors the server explains come back as non-2xx with a JSON body.
  if (error) {
    const context = (error as { context?: Response }).context;
    const body = (await context?.json?.().catch(() => null)) as
      OnlineResponse | null | undefined;
    throw new Error(
      body && !body.ok
        ? body.error
        : "通信できませんでした。電波を確認してください。",
    );
  }
  if (!data || !data.ok) {
    throw new Error(data?.error ?? "通信できませんでした。");
  }
  return data.room;
}

export async function fetchRoom(roomId: string): Promise<OnlineRoom | null> {
  const { data } = await getSupabase()
    .from("online_rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();
  return (data as OnlineRoom | null) ?? null;
}

// Calls `onChange` whenever the room row changes. Returns an unsubscribe
// function.
export function subscribeRoom(
  roomId: string,
  onChange: (room: OnlineRoom) => void,
): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`online-room-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "online_rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => onChange(payload.new as OnlineRoom),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
