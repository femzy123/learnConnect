import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export const metadata = {
  title: "Learn Connect",
  description: "WHere students and teachers connect",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${openSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
