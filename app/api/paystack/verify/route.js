import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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
        if (!process.env.PAYSTACK_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Payment configuration is missing" }, 503);
        const user = await getUser(request);
        if (!user) return json({ error: "Sign in to verify payment" }, 401);
        const { reference } = await request.json();
        if (!reference || !/^[a-zA-Z0-9._-]+$/.test(reference)) return json({ error: "Invalid payment reference" }, 400);

        const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        });
        const result = await response.json();
        const transaction = result.data;
        if (!response.ok || !result.status || transaction?.status !== "success") return json({ error: "Payment was not completed" }, 400);
        if (transaction.customer?.email?.toLowerCase() !== user.email?.toLowerCase() || transaction.metadata?.user_id !== user.id) return json({ error: "Payment account mismatch" }, 403);

        const plan = transaction.metadata?.plan;
        if (!["builder", "pro"].includes(plan)) return json({ error: "Invalid paid plan" }, 400);
        const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
        const periodStart = new Date();
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        const subscription = await adminClient.from("subscriptions").upsert({
            user_id: user.id,
            plan,
            status: "active",
            billing_interval: "month",
            provider: "paystack",
            provider_customer_id: transaction.customer?.customer_code || null,
            provider_subscription_id: reference,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
        }, { onConflict: "user_id" });
        if (subscription.error) throw subscription.error;
        const profile = await adminClient.from("profiles").update({ plan }).eq("id", user.id);
        if (profile.error) throw profile.error;
        return json({ ok: true, plan });
    } catch (error) {
        return json({ error: error.message || "Unable to verify payment" }, 500);
    }
}