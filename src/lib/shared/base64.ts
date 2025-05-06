function base64UrlEncode(buffer: Uint8Array): string {
    return Buffer.from(buffer)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  
  export function generateUrlSafeRandomString(length: number = 32): string {
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    return base64UrlEncode(randomBytes);
  }