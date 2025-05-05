
export const WALLET_ADDRESS_COOKIE = "wallet_address";

export function setWalletAddressCookie(address: string) {
  // Set cookie for 30 days
  document.cookie = `${WALLET_ADDRESS_COOKIE}=${address}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function getWalletAddressCookie(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[WALLET_ADDRESS_COOKIE];
} 