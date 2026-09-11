import { NextResponse } from "next/server";

const installers = {
    windows: {
        filename: "Swiss-Dev-Setup.exe",
        contentType: "application/vnd.microsoft.portable-executable",
    },
    mac: {
        filename: "Swiss-Dev.dmg",
        contentType: "application/x-apple-diskimage",
    },
};

export async function GET(request, { params }) {
    const installer = installers[params.platform];

    if (!installer) {
        return NextResponse.json({ error: "Unknown installer" }, { status: 404 });
    }

    const releaseUrl = `https://github.com/Ratna-Babu/ai-website-builder/releases/latest/download/${installer.filename}`;
    const response = await fetch(releaseUrl, { redirect: "follow" });

    if (!response.ok || !response.body) {
        return NextResponse.json(
            { error: "This installer has not been published yet." },
            { status: response.status === 404 ? 404 : 502 },
        );
    }

    return new Response(response.body, {
        headers: {
            "Content-Type": installer.contentType,
            "Content-Disposition": `attachment; filename="${installer.filename}"`,
            "Cache-Control": "public, max-age=300",
        },
    });
}