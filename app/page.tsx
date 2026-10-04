export default function Page(){
  return (
    <div style={{minHeight:'100vh',background:'#08080f',color:'white',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <h1>🟣 PerryNobeSMS LIVE</h1>
      <p style={{opacity:0.6}}>Main site is UP</p>
      <div style={{display:'flex',gap:12,marginTop:20}}>
        <a href="/login" style={{padding:'12px 20px',background:'#7c3aed',color:'white',borderRadius:10,textDecoration:'none'}}>Go to Login</a>
        <a href="/admin" style={{padding:'12px 20px',background:'white',color:'black',borderRadius:10,textDecoration:'none'}}>Go to Admin</a>
      </div>
    </div>
  )
}
