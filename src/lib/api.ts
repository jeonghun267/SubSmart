import { supabase } from "./supabase";

/**
 * 인증 토큰이 포함된 fetch 래퍼
 * API 라우트 호출 시 자동으로 Bearer 토큰을 추가합니다.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
