import { redirect } from "next/navigation";

export default async function NewProductPage() {
  redirect("/dashboard/productos/nuevo");
}
