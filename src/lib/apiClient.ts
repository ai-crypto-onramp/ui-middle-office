import { authedFetch } from "./tokenStore";
import { loadConfig } from "@/config";
import type { ZodTypeAny } from "zod";

const config = loadConfig();

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiGet<T>(
  url: string,
  schema: ZodTypeAny,
  mock: () => T | Promise<T>,
): Promise<T> {
  if (config.mockMode) return mock();
  const res = await authedFetch(url);
  if (!res.ok) throw new ApiError(res.status, `GET ${url} failed`, await res.text());
  const data = (await res.json()) as unknown;
  return schema.parse(data) as T;
}

export async function apiPost<T>(
  url: string,
  body: unknown,
  schema: ZodTypeAny,
  mock: () => T | Promise<T>,
): Promise<T> {
  if (config.mockMode) return mock();
  const res = await authedFetch(url, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new ApiError(res.status, `POST ${url} failed`, await res.text());
  const data = (await res.json()) as unknown;
  return schema.parse(data) as T;
}

export async function apiPostRaw<T>(url: string, body: unknown, schema: ZodTypeAny): Promise<T> {
  const res = await authedFetch(url, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new ApiError(res.status, `POST ${url} failed`, await res.text());
  const data = (await res.json()) as unknown;
  return schema.parse(data) as T;
}

export async function apiMutate<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: unknown,
  schema: ZodTypeAny,
  mock: () => T | Promise<T>,
): Promise<T> {
  if (config.mockMode) return mock();
  const res = await authedFetch(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, `${method} ${url} failed`, await res.text());
  const data = (await res.json()) as unknown;
  return schema.parse(data) as T;
}