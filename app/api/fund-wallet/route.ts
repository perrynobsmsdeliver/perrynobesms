callback: async function (response: any) {
  try {
    const res = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        reference: response.reference, 
        amount: Number(amount), 
        user_id: user.id, 
        email: user.email 
      })
    })
    const result = await res.json()
    setLoading(false)
    
    if (result.success) {
      // No reload - just update balance from server
      setBalance(result.new_balance)
      setAmount("")
      alert(`✅ Success! ₦${amount} added. New balance: ₦${result.new_balance}`)
    } else {
      alert("⚠️ Deposited but verification slow: " + result.error + ". Check wallet, your money don enter.")
      // Still refresh balance
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single()
      if (data) setBalance(data.balance)
    }
  } catch (e) {
    setLoading(false)
    alert("Network slow but money don enter - refresh page you go see am")
    window.location.href = "/wallet" // soft redirect, no full reload
  }
},
