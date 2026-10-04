"use client";
import { useState } from "react";

export default function Test() {
  const testPay = () => {
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    console.log("KEY:", key);
    alert("Key found: " + (key ? key.substring(0,15) + "..." : "MISSING - check Vercel env"));
    
    // @ts-ignore
    if (!window.PaystackPop) {
      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.onload = () => {
        // @ts-ignore
        const h = window.PaystackPop.setup({
          key: key,
          email: "test@perrynobe.site",
          amount: 10000,
          callback: (res:any) => alert("Success! " + res.reference)
        });
        h.openIframe();
      };
      document.body.appendChild(s);
    } else {
      // @ts-ignore
      const h = window.PaystackPop.setup({
        key: key,
        email: "test@perrynobe.site",
        amount: 10000,
        callback: (res:any) => alert("Success! " + res.reference)
      });
      h.openIframe();
    }
  };
  return <button onClick={testPay} style={{padding:20, margin:50, fontSize:20}}>TEST PAYSTACK POPUP</button>;
}
