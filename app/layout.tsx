import Script from "next/script";

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
