export default function manifest() {
    return {
        name: "Swiss Dev",
        short_name: "Swiss Dev",
        description: "Build polished websites with an agentic Swiss Dev workspace.",
        start_url: "/",
        display: "browser",
        background_color: "#202124",
        theme_color: "#4285F4",
        icons: [
            {
                 src: "/logo.svg.png.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable",
            },
            {
                 src: "/logo.svg.png.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
            },
        ],
    };
}

