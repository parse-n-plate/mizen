import { redirect } from "next/navigation";

export default async function ProfilePage() {
  // Supabase not connected — redirect to home
  redirect("/");
}
