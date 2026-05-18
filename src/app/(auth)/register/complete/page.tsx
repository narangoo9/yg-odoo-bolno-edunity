import { redirect } from "next/navigation";

/** Хуучин URL — одоо /register дээр нэгтгэсэн */
export default function RegisterCompleteRedirectPage() {
  redirect("/register");
}
