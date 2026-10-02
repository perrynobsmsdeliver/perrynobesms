export default function Admin(){
  return (
    <div style={{padding:24, maxWidth:900, margin:'0 auto', fontFamily:'system-ui'}}>
      <a href="/" style={{textDecoration:'none'}}>← Home</a>
      <h2 style={{marginTop:16}}>Admin Panel - PerryNobeSMS</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:16}}>
        <div style={{background:'white', padding:16, borderRadius:12, border:'1px solid #e5e7eb'}}><b>Total Users</b><br/><span style={{fontSize:24}}>1,247</span></div>
        <div style={{background:'white', padding:16, borderRadius:12, border:'1px solid #e5e7eb'}}><b>Wallet Balance</b><br/><span style={{fontSize:24}}>₦2.4M</span></div>
        <div style={{background:'white', padding:16, borderRadius:12, border:'1px solid #e5e7eb'}}><b>SMS Sent Today</b><br/><span style={{fontSize:24}}>18,430</span></div>
      </div>
      <div style={{background:'white', padding:20, borderRadius:12, border:'1px solid #e5e7eb', marginTop:16}}>
        <b>Set Your Profit Margin (₦)</b>
        <div style={{display:'flex', gap:8, marginTop:12, flexWrap:'wrap'}}>
          <input defaultValue="3.50" style={{padding:10, border:'1px solid #d1d5db', borderRadius:8, width:100}}/> <span>Bulk SMS price</span>
        </div>
        <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
          <input defaultValue="2" style={{padding:10, border:'1px solid #d1d5db', borderRadius:8, width:100}}/> <span>Airtime % discount</span>
        </div>
        <button style={{marginTop:16, padding:'10px 20px', background:'#111827', color:'white', border:0, borderRadius:8}}>Save Settings</button>
      </div>
    </div>
  )
}
