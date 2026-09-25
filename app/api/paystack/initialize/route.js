import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const planPrices = { builder: 799, pro: 2199 };

function json(data, status = 200) {
    return Response.json(data, { status });
}

async function getUser(request) {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await client.auth.getUser();
    return data.user || null;
}

export async function POST(request) {
    try {
        if (!process.env.PAYSTACK_SECRET_KEY) return json({ error: "Payment configuration is missing" }, 503);
        const user = await getUser(request);
        if (!user) return json({ error: "Sign in before choosing a paid plan" }, 401);
        const { plan } = await request.json();
        const amount = planPrices[plan];
        if (!amount) return json({ error: "Invalid plan" }, 400);

        const response = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                email: user.email,
                amount: amount * 100,
                currency: "USD",
                callback_url: `${new URL(request.url).origin}/billing/complete`,
                metadata: { user_id: user.id, plan, billing_interval: "month" },
            }),
        });
        const result = await response.json();
        if (!response.ok || !result.status) return json({ error: result.message || "Unable to start payment" }, 502);
        return json({ authorization_url: result.data.authorization_url, reference: result.data.reference });
    } catch (error) {
        return json({ error: error.message || "Unable to start payment" }, 500);
    }
}