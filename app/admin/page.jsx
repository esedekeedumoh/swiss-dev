"use client";

import { useEffect, useState } from "react";
import { BarChart3, LogOut, ShieldCheck, UserPlus, Users, Zap } from "lucide-react";

const plans = ["free", "builder", "pro"];

async function adminRequest(options = {}) {
    const response = await fetch("/api/admin", { headers: { "Content-Type": "application/json" }, ...options });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
}

function Field({ label, ...props }) {
    return <label className="block text-sm font-medium text-[#163b2d]">{label}<input {...props} className="mt-2 w-full rounded-lg border border-[#163b2d]/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#163b2d]" /></label>;
}

export default function AdminPage() {
    const [admin, setAdmin] = useState(null);
    const [data, setData] = useState(null);
    const [editingAdminId, setEditingAdminId] = useState(null);
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [form, setForm] = useState({ email: "", password: "", name: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = async () => { const result = await adminRequest(); setData(result); setAdmin(result.admin); };
    useEffect(() => { load().catch(() => {}); }, []);

    const login = async (event) => {
        event.preventDefault(); setError("");
        try { const result = await adminRequest({ method: "POST", body: JSON.stringify({ action: "login", ...credentials }) }); setAdmin(result.admin); await load(); }
        catch (requestError) { setError(requestError.message); }
    };
    const action = async (body) => {
        setError(""); setMessage("");
        try { await adminRequest({ method: "POST", body: JSON.stringify(body) }); setMessage("Changes saved"); await load(); }
        catch (requestError) { setError(requestError.message); }
    };

    if (!admin) return <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3] px-6 text-[#17231e] swiss-grid"><form onSubmit={login} className="w-full max-w-md rounded-2xl border border-[#163b2d]/15 bg-white p-8 shadow-xl"><div className="mb-8 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#163b2d] text-[#d8f36a]"><ShieldCheck /></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#68776f]">Swiss Dev</p><h1 className="text-2xl font-semibold">Admin access</h1></div></div><div className="space-y-4"><Field label="Email" type="email" value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} /><Field label="Password" type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></div>{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}<button className="mt-6 w-full rounded-lg bg-[#163b2d] py-3 text-sm font-semibold text-white">Sign in</button></form></main>;

    const usageTotal = (data?.usage || []).reduce((total, item) => total + item.ai_requests, 0);
    const beginAdminEdit = (item) => {
        setForm({ ...form, adminEmail: item.email, adminName: item.display_name, adminPassword: "" });
        setEditingAdminId(item.id);
    };
    return <main className="min-h-screen bg-[#f5f6f3] px-5 py-6 text-[#17231e] sm:px-10 swiss-grid"><header className="mx-auto flex max-w-7xl items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#68776f]">Swiss Dev control room</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.04em]">Admin dashboard</h1></div><button onClick={() => adminRequest({ method: "POST", body: JSON.stringify({ action: "logout" }) }).then(() => setAdmin(null))} className="flex items-center gap-2 rounded-lg border border-[#163b2d]/15 bg-white px-3 py-2 text-sm"><LogOut className="h-4 w-4" /> Sign out</button></header><section className="mx-auto mt-8 grid max-w-7xl gap-4 sm:grid-cols-3"><Stat icon={<Users />} label="Users" value={data?.users?.length || 0} /><Stat icon={<Zap />} label="AI requests, 30 days" value={usageTotal} /><Stat icon={<BarChart3 />} label="Workspaces" value={data?.workspaceCount || 0} /></section><section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-[1.5fr_1fr]"><div className="rounded-2xl border border-[#163b2d]/15 bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5" /> Users and plans</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[#163b2d]/10 text-xs uppercase tracking-wider text-[#68776f]"><tr><th className="py-3">User</th><th>Created</th><th>Plan</th><th>Action</th></tr></thead><tbody>{(data?.users || []).map((user) => <tr key={user.id} className="border-b border-[#163b2d]/10"><td className="py-3"><b>{user.display_name || "Unnamed"}</b><div className="text-xs text-[#68776f]">{user.email}</div></td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><select value={user.plan || "free"} onChange={(event) => action({ action: "set-plan", userId: user.id, plan: event.target.value })} className="rounded border border-[#163b2d]/15 px-2 py-1 text-sm">{plans.map((plan) => <option key={plan}>{plan}</option>)}</select></td><td><span className="text-xs text-[#68776f]">Update instantly</span></td></tr>)}</tbody></table></div></div><div className="space-y-6"><div className="rounded-2xl border border-[#163b2d]/15 bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-semibold"><UserPlus className="h-5 w-5" /> Add user</h2><div className="mt-4 space-y-3"><Field label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Field label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><Field label="Temporary password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button onClick={() => action({ action: "create-user", ...form })} className="mt-2 w-full rounded-lg bg-[#163b2d] py-2.5 text-sm font-semibold text-white">Create user</button></div></div><div className="rounded-2xl border border-[#163b2d]/15 bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5" /> Admin accounts</h2><div className="mt-3 space-y-2 text-sm">{(data?.admins || []).map((item) => <div key={item.id} className="flex items-center justify-between border-b border-[#163b2d]/10 py-2"><span>{item.email}</span><button onClick={() => action({ action: "delete-admin", id: item.id })} className="text-xs text-red-600">Remove</button></div>)}</div><div className="mt-4 space-y-3"><Field label="New admin email" value={form.adminEmail || ""} onChange={(event) => setForm({ ...form, adminEmail: event.target.value })} /><Field label="New admin password" type="password" value={form.adminPassword || ""} onChange={(event) => setForm({ ...form, adminPassword: event.target.value })} /><button onClick={() => action({ action: "create-admin", email: form.adminEmail, password: form.adminPassword, name: form.adminName })} className="w-full rounded-lg border border-[#163b2d] py-2.5 text-sm font-semibold">Create admin</button></div></div></div></section>{(message || error) && <p className={`mx-auto mt-5 max-w-7xl text-sm ${error ? "text-red-600" : "text-[#163b2d]"}`}>{error || message}</p>}</main>;
}

function Stat({ icon, label, value }) { return <div className="rounded-2xl border border-[#163b2d]/15 bg-white p-5"><div className="flex items-center gap-2 text-[#68776f]">{icon}<span className="text-sm">{label}</span></div><p className="mt-3 text-3xl font-semibold">{value}</p></div>; }