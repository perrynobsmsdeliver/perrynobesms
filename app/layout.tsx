import Script from "next/script";

export const metadata = {
  title: "perryotp.com.ng - Instant OTP Numbers",
  description: "Buy instant OTP numbers for WhatsApp, Telegram, Facebook, TikTok, Google and 20+ apps. Cheap, fast, 24/7 at perryotp.com.ng",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "perryotp.com.ng - Instant OTP Numbers",
    description: "Cheap OTP numbers worldwide - WhatsApp, Telegram, Facebook and more",
    url: "https://perryotp.com.ng",
    siteName: "perryotp",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body style={{margin:0, fontFamily:'system-ui, sans-serif', background:'#08080f'}}>
        <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  )
}
