import { redirect } from "next/navigation";

export default function HomePage() {
  // Always redirect to talk rooms — browsing is allowed without login
  redirect("/talk");
}
