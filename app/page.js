import Hero from "@/components/custom/Hero";
import DesktopEntry from "@/components/custom/DesktopEntry";

export default function Home() {
  return <DesktopAwareHome />;
}

function DesktopAwareHome() {
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return <DesktopEntry />;
  }

  return <Hero />;
}
