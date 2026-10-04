export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import HomeClient from "./HomeClient";
export default function Page(){
  return <Suspense fallback={<div style={{background:'#08080f',color:'white',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>Loading...</div>}><HomeClient/></Suspense>
}
