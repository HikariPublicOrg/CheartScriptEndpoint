// 字符串转 ArrayBuffer 工具函数
function str2ab(str :string) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// ArrayBuffer 转 Base64 工具函数
function ab2base64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 转 ArrayBuffer 工具函数
function base642ab(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// 加密函数
export async function encryptData(data: string, secret: string) {
  const enc = new TextEncoder();
  // 使用 SHA-256 派生一个安全的 256-bit 密钥
  const keyBytes = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  // 生成 12 字节的随机 IV (初始化向量)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = enc.encode(data);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encodedData
  );

  // 将 IV 和密文合并为一个 Uint8Array 并转为 Base64
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return ab2base64(combined.buffer);
}

// 解密函数 (供后续 API 使用)
export async function decryptData(encryptedStr: string, secret: string) {
  const enc = new TextEncoder();
  const keyBytes = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const combined = new Uint8Array(base642ab(encryptedStr));
  const iv = combined.slice(0, 12);
  const encryptedBuffer = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}