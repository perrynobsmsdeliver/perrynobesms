"use client";
export default function Dashboard(){
  return (
    <div style={{padding:24, maxWidth:900, margin:'0 auto', fontFamily:'system-ui'}}>
      <a href="/" style={{textDecoration:'none'}}>← Back to Home</a>
      <h2 style={{marginTop:16}}>Dashboard</h2>
      <div style={{background:'#111827', color:'white', padding:20, borderRadius:16, marginTop:12}}>
        Wallet Balance: ₦5,000.00 <span style={{background:'#22c55e', padding:'4px 8px', borderRadius:20, fontSize:12, marginLeft:8}}>Active</span>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:16}}>
        <div style={{background:'white', padding:16, borderRadius:12, border:'1px solid #e5e7eb'}}><b>Send Bulk SMS</b><br/><button style={{marginTop:8, width:'100%', padding:10, background:'#111827', color:'white', border:0, borderRadius:8}}>Compose</button></div>
        <div style={{background:'white', padding:16, borderRadius:12, border:'1px solid #e5e7eb'}}><b>Buy Airtime (VTU)</b><br/><button style={{marginTop:8, width:'100%', padding:10, background:'#2563eb', color:'white', border:0, borderRadius:8}}>Buy Now - 2% Off</button></div>
        <div style={{background:'white', padding:16, borderRadius:12, border:'1px solid #e5e7eb'}}><b>Buy Data</b><br/><button style={{marginTop:8, width:'100%', padding:10, background:'#059669', color:'white', border:0, borderRadius:8}}>Buy Data - From ₦280</button></div>
        <div style={{background:'white', padding:16, borderRadius:12, border:'1px solid #e5e7eb'}}><b>Fund Wallet</b><br/><button style={{marginTop:8, width:'100%', padding:10, background:'#f3f4f6', border:0, borderRadius:8}}>Paystack / Transfer</button></div>
      </div>
    </div>
  )
}
