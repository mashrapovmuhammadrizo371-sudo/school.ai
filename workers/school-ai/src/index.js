const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/api/health") {
      try {
        const result = await env.DB.prepare("SELECT 1 AS ok").first();
        return json({
          ok: result?.ok === 1,
          service: "SCHOOL.AI API",
          database: "connected",
          stage: "cloudflare-migration-bootstrap"
        });
      } catch (error) {
        return json({
          ok: false,
          service: "SCHOOL.AI API",
          database: "unavailable"
        }, 503);
      }
    }

    return json({
      ok: false,
      error: "API route is not migrated yet.",
      service: "SCHOOL.AI API"
    }, 404);
  }
};
