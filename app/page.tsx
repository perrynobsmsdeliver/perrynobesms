export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import HomeClient from "./HomeClient";

export default function Page(){
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#08080f",color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>Loading PerryNobe...</div>}>
      <HomeClient />
    </Suspense>
  )
}
