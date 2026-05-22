const DATAFAST_SCRIPT_URL = "https://datafa.st/js/script.js";
const DATAFAST_EVENTS_URL = "https://datafa.st/api/events";

interface Env {
    ASSETS: Fetcher;
}

function getClientIp(request: Request) {
    return (
        request.headers.get("x-real-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("cf-connecting-ip") ||
        ""
    );
}

function jsonResponse(message: string, status = 404) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (
            url.pathname === "/js/script.js" &&
            (request.method === "GET" || request.method === "HEAD")
        ) {
            const response = await fetch(DATAFAST_SCRIPT_URL, {
                cf: {
                    cacheEverything: true,
                    cacheTtl: 31536000,
                },
            });

            return new Response(request.method === "HEAD" ? null : response.body, {
                status: response.status,
                headers: {
                    "Content-Type": "application/javascript; charset=utf-8",
                    "Cache-Control": "public, max-age=31536000",
                },
            });
        }

        if (url.pathname === "/api/events" && request.method === "POST") {
            const response = await fetch(DATAFAST_EVENTS_URL, {
                method: "POST",
                headers: {
                    "Content-Type":
                        request.headers.get("Content-Type") ||
                        "application/json",
                    "User-Agent": request.headers.get("User-Agent") || "",
                    Origin: request.headers.get("Origin") || url.origin,
                    "x-datafast-real-ip": getClientIp(request),
                },
                body: request.body,
            });

            return new Response(response.body, {
                status: response.status,
                headers: {
                    "Content-Type":
                        response.headers.get("Content-Type") ||
                        "application/json",
                },
            });
        }

        return env.ASSETS.fetch(request);
    },
} satisfies ExportedHandler<Env>;
