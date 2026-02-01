import { supabase } from "@/integrations/supabase/client";

/**
 * Call backend RPCs without relying on generated type definitions.
 * This keeps the app compiling even before type generation catches up after migrations.
 */
export async function rpcUntyped<T = any>(fn: string, params?: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return (supabase as any).rpc(fn, params) as Promise<{ data: T; error: any }>;
}
