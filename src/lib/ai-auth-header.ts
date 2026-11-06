import { supabase } from "@/integrations/supabase/client";

/** Adds the signed-in user's token so AI limits count per account instead of per network. */
export async function aiHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) headers["Authorization"] = `Bearer ${data.session.access_token}`;
  return headers;
}
