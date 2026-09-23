import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_NAME = process.env.API_NAME || "🫧🦋 ʀuɴAk API";
const ADMIN_KEY = process.env.ADMIN_KEY || "change-this-admin-key";

const keys = new Map();
const dailyLimit = Number(process.env.DEFAULT_DAILY_LIMIT || 1000);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeKey() {
  return "RUNAK-" + crypto.randomBytes(18).toString("hex");
}

function auth(req, res, next) {
  const key = req.query.api_key || req.headers["x-api-key"];
  if (!key || !keys.has(key)) {
    return res.status(401).json({ ok: false, error: "Invalid or missing API key" });
  }
  const item = keys.get(key);
  if (item.expiresAt && Date.now() > item.expiresAt) {
    return res.status(401).json({ ok: false, error: "API key expired" });
  }
  const d = today();
  if (item.day !== d) { item.day = d; item.requests = 0; }
  if (item.requests >= item.limit) {
    return res.status(429).json({ ok: false, error: "Daily API limit reached" });
  }
  item.requests++;
  next();
}

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${API_NAME}</title>
<style>
body{margin:0;font-family:system-ui;background:#0b1020;color:#eef2ff}
main{max-width:900px;margin:60px auto;padding:24px}.card{background:#151c33;border:1px solid #2b3557;border-radius:20px;padding:28px}
h1{font-size:38px;margin:0 0 10px}.muted{color:#aab4d0}
code{background:#0b1020;padding:3px 7px;border-radius:6px}
.endpoint{margin:12px 0;padding:14px;border-radius:12px;background:#0f162b}
</style></head><body><main><div class="card">
<h1>🫧🦋 ʀuɴAk API</h1><p class="muted">Your own API gateway for authorized music/data services.</p>
<h2>Endpoints</h2>
<div class="endpoint"><code>GET /status</code> — API status</div>
<div class="endpoint"><code>GET /me</code> — key usage information</div>
<div class="endpoint"><code>GET /download</code> — authorized media-provider adapter</div>
<div class="endpoint"><code>GET /stream/:id</code> — authorized stream adapter</div>
<p class="muted">API keys are created by the admin endpoint.</p>
</div></main></body></html>`);
});

app.get("/status", (req, res) => {
  res.json({ ok: true, name: API_NAME, status: "online", version: "1.0.0" });
});

app.get("/me", auth, (req, res) => {
  const key = req.query.api_key || req.headers["x-api-key"];
  const item = keys.get(key);
  res.json({ ok: true, requestsToday: item.requests, dailyLimit: item.limit, expiresAt: item.expiresAt || null });
});

app.post("/admin/keys", (req, res) => {
  if (req.headers["x-admin-key"] !== ADMIN_KEY)
    return res.status(403).json({ ok: false, error: "Forbidden" });

  const limit = Math.max(1, Number(req.body?.dailyLimit || dailyLimit));
  const days = Math.max(1, Number(req.body?.days || 30));
  const key = makeKey();

  keys.set(key, {
    limit,
    requests: 0,
    day: today(),
    expiresAt: Date.now() + days * 86400000
  });

  res.json({ ok: true, api_key: key, dailyLimit: limit, validDays: days });
});

// Safe adapter boundary: connect this route to a provider/source you are authorized to use.
app.get("/download", auth, async (req, res) => {
  const { url, type = "audio" } = req.query;
  if (!url) return res.status(400).json({ ok: false, error: "Missing url" });

  res.status(501).json({
    ok: false,
    error: "Provider adapter not configured",
    message: "Connect an authorized music/media provider in provider.js.",
    requestedType: type,
    url
  });
});

app.get("/stream/:id", auth, async (req, res) => {
  res.status(501).json({
    ok: false,
    error: "Provider adapter not configured",
    message: "Connect an authorized streaming provider in provider.js.",
    id: req.params.id,
    type: req.query.type || "audio"
  });
});

app.listen(PORT, () => console.log(`${API_NAME} running on port ${PORT}`));
