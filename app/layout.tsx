export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://js.paystack.co/v1/inline.js"></script>
      </head>
      <body style={{margin:0, fontFamily:'system-ui, sans-serif', background:'#08080f'}}>
        {children}
      </body>
    </html>
  )
}
