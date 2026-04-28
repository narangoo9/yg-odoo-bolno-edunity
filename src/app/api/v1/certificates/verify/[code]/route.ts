import { NextRequest } from "next/server";
import { verifyCertificate } from "@/modules/certificates/infrastructure/certificate-service";
import { ok, notFound, serverError } from "@/shared/utils/api-response";

interface Params { params: Promise<{ code: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { code } = await params;
    const cert = await verifyCertificate(code);
    if (!cert) return notFound("Сертификат олдсонгүй эсвэл хүчингүй байна");
    return ok(cert);
  } catch {
    return serverError();
  }
}
