const LOGIN_ERROR_BY_CODE: Record<string, string> = {
  user_not_found:
    "Энэ имэйлээр бүртгэл олдсонгүй. Эхлээд бүртгүүлнэ үү.",
  wrong_password: "Нууц үг буруу байна. Дахин оролдоно уу.",
  oauth_only:
    "Энэ имэйл Google-ээр бүртгэгдсэн байна. Google-ээр нэвтэрнэ үү эсвэл нууц үг сэргээнэ үү.",
  account_suspended: "Таны бүртгэл түр хаагдсан байна. Админтай холбогдоно уу.",
  org_pending:
    "Байгууллагын бүртгэл админаас зөвшөөрөгдөөгүй байна. Зөвшөөрөл ирэхэд дахин нэвтэрнэ үү.",
  credentials: "Имэйл эсвэл нууц үг буруу байна.",
};

const LOGIN_ERROR_BY_TYPE: Record<string, string> = {
  CredentialsSignin: "Имэйл эсвэл нууц үг буруу байна.",
  AccessDenied: "Нэвтрэх эрх хязгаарлагдсан байна.",
  OAuthSignin: "Google руу шилжих үед алдаа гарлаа. Дахин оролдоно уу.",
  OAuthCallback:
    "Google-аас буцаж ирэх үед алдаа гарлаа. Дахин оролдоно уу.",
  OAuthCreateAccount: "Google хэрэглэгч үүсгэхэд алдаа гарлаа.",
  OAuthAccountNotLinked:
    "Энэ имэйл өөр аргаар бүртгэгдсэн байна. Имэйл/нууц үгээр нэвтэрнэ үү.",
  CallbackRouteError: "Нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.",
  AdapterError: "Нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.",
  Verification: "Имэйл баталгаажуулалт амжилтгүй боллоо.",
};

/** Зөвхөн dev/admin — жинхэнэ тохиргооны алдаа */
const CONFIG_ERROR_MESSAGE =
  "Auth тохиргоо буруу байна. AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, NEXTAUTH_URL-г .env файлд шалгана уу.";

export function resolveLoginErrorMessage(
  errorType?: string | null,
  errorCode?: string | null,
): string {
  if (errorCode && LOGIN_ERROR_BY_CODE[errorCode]) {
    return LOGIN_ERROR_BY_CODE[errorCode];
  }

  if (errorType && LOGIN_ERROR_BY_TYPE[errorType]) {
    return LOGIN_ERROR_BY_TYPE[errorType];
  }

  if (errorType === "MissingSecret") {
    return CONFIG_ERROR_MESSAGE;
  }

  if (errorType === "Configuration") {
    return "Нэвтрэх үед алдаа гарлаа. Имэйл, нууц үгээ шалгаад дахин оролдоно уу.";
  }

  return "Нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.";
}

export { CONFIG_ERROR_MESSAGE };
