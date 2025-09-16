export async function paystackInit({ email, amount, reference, callback_url, metadata }) {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, amount, reference, currency: "NGN", callback_url, metadata }),
    // amount is in kobo (minor units)
  });
  const json = await res.json();
  if (!json?.status) throw new Error(json?.message || "Failed to initialize Paystack");
  return json.data; // { authorization_url, access_code, reference }
}

export async function paystackVerify(reference) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!json?.status) throw new Error(json?.message || "Verification failed");
  return json.data; // contains status, amount, currency, customer.email, etc.
}
