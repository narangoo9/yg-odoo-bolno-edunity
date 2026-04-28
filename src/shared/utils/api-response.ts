import { NextResponse } from "next/server";

export type ApiResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: unknown };

export function ok<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, message }, { status: 200 });
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function badRequest(error: string, details?: unknown): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error, details }, { status: 400 });
}

export function unauthorized(error = "Нэвтрэх шаардлагатай"): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

export function forbidden(error = "Эрхгүй"): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

export function notFound(error = "Олдсонгүй"): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status: 404 });
}

export function serverError(error = "Серверийн алдаа"): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status: 500 });
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
