import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@radix-ui/react-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Video Streaming App",
  description: "A modern video streaming application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
        <body className={inter.className}>
          <Toaster />
          <ToastProvider>
          {children}
          </ToastProvider>
          </body>
    </html>
  );
}
