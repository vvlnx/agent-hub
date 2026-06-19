import { createHmac } from "node:crypto";
import { EnvHttpProxyAgent, ProxyAgent, request } from "undici";

const BITGET_API_BASE_URL = "https://api.bitget.com";
const REQUEST_TIMEOUT_MS = 12_000;

const configuredProxy =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.ALL_PROXY ||
  process.env.all_proxy;
const DISPATCHER = configuredProxy ? new ProxyAgent(configuredProxy) : new EnvHttpProxyAgent();

export interface BitgetPrivateCredentials {
  apiKey: string;
  secretKey: string;
  passphrase: string;
  paperTrading: boolean;
}

export function loadBitgetDemoCredentials(): BitgetPrivateCredentials | null {
  const apiKey =
    process.env.BITGET_DEMO_API_KEY?.trim() || process.env.BITGET_API_KEY?.trim();
  const secretKey =
    process.env.BITGET_DEMO_SECRET_KEY?.trim() || process.env.BITGET_SECRET_KEY?.trim();
  const passphrase =
    process.env.BITGET_DEMO_PASSPHRASE?.trim() || process.env.BITGET_PASSPHRASE?.trim();
  const paperFlag =
    process.env.BITGET_DEMO_API_KEY?.trim() ||
    process.env.BITGET_PAPER_TRADING?.trim() === "1";

  if (!apiKey || !secretKey || !passphrase || !paperFlag) {
    return null;
  }

  return {
    apiKey,
    secretKey,
    passphrase,
    paperTrading: true,
  };
}

function signPayload(payload: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(payload).digest("base64");
}

interface BitgetEnvelope<T> {
  code: string;
  msg: string;
  data: T;
}

export async function bitgetPrivateRequest<T>({
  credentials,
  method,
  path,
  body,
}: {
  credentials: BitgetPrivateCredentials;
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const bodyJson = body ? JSON.stringify(body) : "";
  const timestamp = Date.now().toString();
  const signature = signPayload(`${timestamp}${method}${path}${bodyJson}`, credentials.secretKey);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    locale: "en-US",
    "ACCESS-KEY": credentials.apiKey,
    "ACCESS-SIGN": signature,
    "ACCESS-TIMESTAMP": timestamp,
    "ACCESS-PASSPHRASE": credentials.passphrase,
  };
  if (credentials.paperTrading) {
    headers.paptrading = "1";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await request(`${BITGET_API_BASE_URL}${path}`, {
      method,
      headers,
      body: bodyJson || undefined,
      signal: controller.signal,
      dispatcher: DISPATCHER,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Bitget private HTTP ${response.statusCode}`);
    }
    const envelope = (await response.body.json()) as BitgetEnvelope<T>;
    if (envelope.code !== "00000") {
      throw new Error(`Bitget private ${envelope.code} ${envelope.msg}`);
    }
    return envelope.data;
  } finally {
    clearTimeout(timeout);
  }
}
