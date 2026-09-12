import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import ConvexClientProvider from "./ConvexClientProvider";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";


export const metadata = {
  title: "Swiss Dev | Build with intent",
  description: "An agentic workspace for turning product ideas into polished, working websites.",
  icons: {
    icon: "/logo.svg.png.png",
    apple: "/logo.svg.png.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning >
      <body>
        <ConvexClientProvider>
        <Provider>
        <ServiceWorkerRegistration />
        {children}
        </Provider>
        </ConvexClientProvider>
        
      </body>
    </html>
  );
}
