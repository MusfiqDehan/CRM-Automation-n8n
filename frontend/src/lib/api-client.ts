import type { ApiEnvelope, CursorPaginatedData } from "./types";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    statusCode = 400,
    fieldErrors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:8017/api/v1";
  }

  public getBaseUrl(): string {
    return this.getEffectiveBaseUrl();
  }

  public getEffectiveBaseUrl(): string {
    if (typeof window !== "undefined") {
      const pageHost = window.location.hostname;
      // If we are browsing on a remote domain/IP or HTTPS, but baseUrl points to http://localhost,
      // fallback to relative /api/v1 to prevent Mixed Content and NetworkError
      if (
        (window.location.protocol === "https:" && this.baseUrl.startsWith("http://")) ||
        (pageHost !== "localhost" && pageHost !== "127.0.0.1" && this.baseUrl.includes("localhost"))
      ) {
        return "/api/v1";
      }
    }
    return this.baseUrl;
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): string {
    const rawBase = (this.getEffectiveBaseUrl() || "http://localhost:8017/api/v1").trim();
    const cleanBase = rawBase.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const combinedPath = `${cleanBase}${cleanEndpoint}`.replace(/([^:]\/)\/+/g, "$1");

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : (process.env.BACKEND_INTERNAL_URL || "http://localhost:3017");

    const url = new URL(combinedPath, origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, string | number | boolean | undefined | null>
  ): Promise<ApiEnvelope<T>> {
    const url = this.buildUrl(endpoint, params);
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        cache: "no-store",
      });
    } catch (networkErr) {
      const msg =
        networkErr instanceof Error ? networkErr.message : "Network error";
      throw new ApiError(`Network error connecting to API: ${msg}`, 0);
    }

    const rawText = await response.text();
    let json: ApiEnvelope<T> | null = null;
    if (rawText && rawText.trim().length > 0) {
      try {
        json = JSON.parse(rawText) as ApiEnvelope<T>;
      } catch {
        json = null;
      }
    }

    if (!response.ok || !json || json.success === false) {
      const errData = (json?.data as unknown as Record<string, unknown>) || {};
      const rawErrors = (errData.errors as Record<string, unknown>) || {};
      const fieldErrors: Record<string, string[]> = {};
      Object.entries(rawErrors).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          fieldErrors[k] = v.map(String);
        } else if (typeof v === "string") {
          fieldErrors[k] = [v];
        }
      });

      const fallbackMsg = !response.ok
        ? `Request failed with status ${response.status} (${response.statusText || "Server Response"})`
        : "The server returned an invalid or unparseable response.";
      const errorMsg = json?.message || fallbackMsg;

      throw new ApiError(errorMsg, response.status, fieldErrors);
    }
    return json;
  }

  public async listPaginated<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): Promise<CursorPaginatedData<T>> {
    const envelope = await this.request<CursorPaginatedData<T>>(
      endpoint,
      { method: "GET" },
      params
    );
    return envelope.data;
  }

  public async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): Promise<T> {
    const envelope = await this.request<T>(endpoint, { method: "GET" }, params);
    return envelope.data;
  }

  public async post<T, P = Record<string, unknown>>(
    endpoint: string,
    payload?: P
  ): Promise<ApiEnvelope<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  }

  public async patch<T, P = Record<string, unknown>>(
    endpoint: string,
    payload: P
  ): Promise<ApiEnvelope<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async delete<T = { id: string }>(endpoint: string): Promise<ApiEnvelope<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

