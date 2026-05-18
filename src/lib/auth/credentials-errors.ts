import { CredentialsSignin } from "next-auth";

/** Бүртгэлгүй имэйл */
export class LoginUserNotFoundError extends CredentialsSignin {
  code = "user_not_found";
}

/** Нууц үг буруу */
export class LoginWrongPasswordError extends CredentialsSignin {
  code = "wrong_password";
}

/** Google-ээр бүртгүүлсэн, нууц үг тохируулаагүй */
export class LoginOAuthOnlyError extends CredentialsSignin {
  code = "oauth_only";
}

/** Түр хаагдсан account */
export class LoginSuspendedError extends CredentialsSignin {
  code = "account_suspended";
}

/** Байгууллага админаас зөвшөөрөгдөөгүй */
export class LoginOrgPendingError extends CredentialsSignin {
  code = "org_pending";
}
