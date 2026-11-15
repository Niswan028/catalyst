import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  message?: string;
}

export function successResponse<T>(
  data: T,
  status = 200,
  meta?: ApiSuccessResponse<T>['meta']
): NextResponse {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return NextResponse.json({ data, ...data, meta }, { status });
  }
  return NextResponse.json({ data, meta }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
      message,
    },
    { status }
  );
}
