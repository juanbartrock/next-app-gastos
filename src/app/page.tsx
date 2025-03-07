import { redirect } from "next/navigation";

// Redirección desde la raíz a dashboard
export default function Home() {
  redirect("/dashboard");
} 