const ROOM_TYPES = ["單人房", "差價雙人房"];
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      return handleAuth(url, env);
    }
    if (url.pathname === "/callback") {
      return handleCallback(url, env);
    }

    if (url.pathname === "/applications") {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }
      if (request.method === "POST") {
        return handleCreateApplication(request, env);
      }
      if (request.method === "GET") {
        return handleListApplications(env);
      }
    }

    var deleteMatch = url.pathname.match(/^\/applications\/([^/]+)$/);
    if (deleteMatch) {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }
      if (request.method === "DELETE") {
        return handleDeleteApplication(deleteMatch[1], env);
      }
    }

    if (url.pathname === "/bed-status") {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }
      if (request.method === "GET") {
        return handleGetBedStatus(env);
      }
      if (request.method === "PUT") {
        return handleSaveBedStatus(request, env);
      }
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },
};

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

const APPLICATIONS_KEY = "applications";

async function readApplications(env) {
  const raw = await env.APPLICATIONS.get(APPLICATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeApplications(env, applications) {
  await env.APPLICATIONS.put(APPLICATIONS_KEY, JSON.stringify(applications));
}

async function handleCreateApplication(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const roomType = typeof body.roomType === "string" ? body.roomType.trim() : "";
  const bedNumber = typeof body.bedNumber === "string" ? body.bedNumber.trim().slice(0, 50) : "";
  const patientName = typeof body.patientName === "string" ? body.patientName.trim().slice(0, 50) : "";

  if (!ROOM_TYPES.includes(roomType) || !bedNumber || !patientName) {
    return jsonResponse({ error: "Missing or invalid fields" }, 400);
  }

  const entry = {
    id: crypto.randomUUID(),
    roomType,
    bedNumber,
    patientName,
    submittedAt: new Date().toISOString(),
  };

  const applications = await readApplications(env);
  applications.push(entry);
  await writeApplications(env, applications);
  return jsonResponse(entry, 201);
}

async function handleListApplications(env) {
  const applications = await readApplications(env);
  return jsonResponse({ applications });
}

async function handleDeleteApplication(id, env) {
  const applications = await readApplications(env);
  const remaining = applications.filter((app) => app.id !== id);
  await writeApplications(env, remaining);
  return jsonResponse({ ok: true });
}

const BED_STATUS_KEY = "bed_status";

async function handleGetBedStatus(env) {
  const raw = await env.APPLICATIONS.get(BED_STATUS_KEY);
  return jsonResponse(raw ? JSON.parse(raw) : {});
}

async function handleSaveBedStatus(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse({ error: "Invalid body" }, 400);
  }

  await env.APPLICATIONS.put(BED_STATUS_KEY, JSON.stringify(body));
  return jsonResponse({ ok: true });
}

function handleAuth(url, env) {
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", `${url.origin}/callback`);
  authUrl.searchParams.set("scope", env.OAUTH_SCOPES || "repo,user");
  return Response.redirect(authUrl.toString(), 302);
}

async function handleCallback(url, env) {
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return new Response(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
  }

  const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });

  const html = `<!DOCTYPE html><html><body>
<script>
(function() {
  function receiveMessage(message) {
    window.opener.postMessage(
      'authorization:github:success:${payload}',
      message.origin
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
}
