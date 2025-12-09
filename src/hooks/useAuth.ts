
export type AuthInfo = {
  token: string | null;
};

export function useAuth(): AuthInfo {
  // Avoid crashing during SSR / build where `window` is undefined
  if (typeof window === "undefined") {
    return { token: null };
  }
 
  const token = window.localStorage.getItem("auth_token");

  return { token };
}
