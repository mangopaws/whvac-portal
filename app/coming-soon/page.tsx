import { redirect } from "next/navigation";
import ComingSoonClient from "./ComingSoonClient";

export const metadata = {
  title: "Coming Soon — WHVAC Member Portal",
};

export default function ComingSoonPage() {
  const launchDateStr = process.env.NEXT_PUBLIC_LAUNCH_DATE;

  // If no launch date or date has passed, redirect to login
  if (launchDateStr) {
    const launchDate = new Date(launchDateStr);
    if (isNaN(launchDate.getTime()) || new Date() >= launchDate) {
      redirect("/login");
    }
  } else {
    // No launch date set → portal is live, go to login
    redirect("/login");
  }

  return <ComingSoonClient launchDate={launchDateStr!} />;
}
