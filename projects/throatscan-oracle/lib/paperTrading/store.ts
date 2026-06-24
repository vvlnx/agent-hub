import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { PaperOrder } from "./types";

const MAX_ORDERS = 200;

function storePath(): string {
  return process.env.THROATSCAN_PAPER_ORDERS_PATH?.trim() || join(process.cwd(), ".data/paper-orders.json");
}

async function readOrders(): Promise<PaperOrder[]> {
  const path = storePath();
  try {
    await mkdir(dirname(path), { recursive: true });
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as PaperOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOrders(orders: PaperOrder[]): Promise<void> {
  const path = storePath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

export async function appendPaperOrders(orders: PaperOrder[]): Promise<void> {
  if (orders.length === 0) return;
  const existing = await readOrders();
  const merged = [...existing, ...orders];
  const trimmed = merged.length > MAX_ORDERS ? merged.slice(merged.length - MAX_ORDERS) : merged;
  await writeOrders(trimmed);
}

export async function listRecentPaperOrders(limit = 20): Promise<PaperOrder[]> {
  const orders = await readOrders();
  return orders.slice(-limit).reverse();
}

export async function countPaperOrders(): Promise<number> {
  const orders = await readOrders();
  return orders.length;
}

export async function clearPaperOrders(): Promise<void> {
  await writeOrders([]);
}
