import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

const cookieName = "swiss_admin_session";
const sessionSecret = process.env.ADMIN_SESSION_SECRET;

function getAdminClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Supabase service configuration is missing");
    }
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

function signSession(admin) {
    if (!sessionSecret) throw new Error("ADMIN_SESSION_SECRET is missing");
    const payload = Buffer.from(JSON.stringify({ id: admin.id, email: admin.email, exp: Date.now() + 86400000 })).toString("base64url");
    const signature = createHmac("sha256", sessionSecret).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

function getSession(request) {
    if (!sessionSecret) return null;
    const token = request.cookies.get(cookieName)?.value;
    if (!token) return null;
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = createHmac("sha256", sessionSecret).update(payload).digest("base64url");
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    try {
        const session = JSON.parse(Buffer.from(payload, "base64url").toString());
        return session.exp > Date.now() ? session : null;
    } catch {
        return null;
    }
}

function json(data, status = 200) {
    return Response.json(data, { status });
}

export async function POST(request) {
    const body = await request.json();
    if (body.action === "login") {
        try {
            const client = getAdminClient();
            const { data, error } = await client.rpc("verify_admin_login", {
                login_email: body.email,
                login_password: body.password,
            });
            if (error) throw error;
            const admin = data?.[0];
            if (!admin) return json({ error: "Invalid admin credentials" }, 401);
            const response = json({ admin: { email: admin.email, displayName: admin.display_name } });
            response.headers.append("Set-Cookie", `${cookieName}=${signSession(admin)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
            return response;
        } catch (error) {
            return json({ error: error.message }, 503);
        }
    }

    if (!getSession(request)) return json({ error: "Unauthorized" }, 401);
    try {
        const client = getAdminClient();
        if (body.action === "logout") {
            const response = json({ ok: true });
            response.headers.append("Set-Cookie", `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
            return response;
        }
        if (body.action === "set-plan") {
            const plan = ["free", "builder", "pro"].includes(body.plan) ? body.plan : null;
            if (!plan || !body.userId) return json({ error: "Invalid plan or user" }, 400);
            const { error } = await client.from("profiles").update({ plan }).eq("id", body.userId);
            if (error) throw error;
            const result = await client.from("subscriptions").upsert({ user_id: body.userId, plan, status: "active" }, { onConflict: "user_id" });
            if (result.error) throw result.error;
            return json({ ok: true });
        }
        if (body.action === "create-user") {
            const { email, password, name } = body;
            const { data, error } = await client.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
            if (error) throw error;
            return json({ user: data.user });
        }
        if (body.action === "create-admin") {
            const { data, error } = await client.rpc("create_admin_account", { new_email: body.email, new_password: body.password, new_display_name: body.name });
            if (error) throw error;
            return json({ admin: data?.[0] });
        }
        if (body.action === "update-admin") {
            const { data, error } = await client.rpc("update_admin_account", { admin_id: body.id, new_email: body.email, new_password: body.password, new_display_name: body.name });
            if (error) throw error;
            return json({ admin: data?.[0] });
        }
        if (body.action === "delete-admin") {
            const session = getSession(request);
            if (session.id === body.id) return json({ error: "You cannot remove your own admin account" }, 400);
            const { error } = await client.from("admin_users").delete().eq("id", body.id);
            if (error) throw error;
            return json({ ok: true });
        }
        return json({ error: "Unknown action" }, 400);
    } catch (error) {
        return json({ error: error.message }, 500);
    }
}

export async function GET(request) {
    const session = getSession(request);
    if (!session) return json({ error: "Unauthorized" }, 401);
    try {
        const client = getAdminClient();
        const [users, plans, usage, workspaces, admins] = await Promise.all([
            client.auth.admin.listUsers({ page: 1, perPage: 1000 }),
            client.from("profiles").select("id, plan, display_name, created_at"),
            client.from("daily_usage").select("user_id, runtime_seconds, ai_requests, usage_date").gte("usage_date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
            client.from("workspaces").select("id", { count: "exact", head: true }),
            client.from("admin_users").select("id, email, display_name, created_at").order("created_at", { ascending: true }),
        ]);
        if (plans.error || usage.error || workspaces.error || admins.error || users.error) throw plans.error || usage.error || workspaces.error || admins.error || users.error;
        const planByUser = Object.fromEntries((plans.data || []).map((profile) => [profile.id, profile]));
        return json({ admin: { email: session.email }, users: (users.data.users || []).map((user) => ({ id: user.id, email: user.email, lastSignIn: user.last_sign_in_at, createdAt: user.created_at, ...planByUser[user.id] })), usage: usage.data || [], workspaceCount: workspaces.count || 0, admins: admins.data || [] });
    } catch (error) {
        return json({ error: error.message }, 500);
    }
}