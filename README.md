# 🫧🦋 ʀuɴAk API

A clean, self-owned API gateway with API-key authentication, usage limits, status endpoint and provider-adapter endpoints.

## Deploy on Render

1. Upload this project to GitHub.
2. Create a new Render Web Service from the repository.
3. Render can use `render.yaml`, or use:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add a strong `ADMIN_KEY` environment variable.
5. Optional: add your custom domain, e.g. `api.example.com`.

## Create an API key

Send:

POST `/admin/keys`

Header:
`x-admin-key: YOUR_ADMIN_KEY`

JSON:
`{"dailyLimit":1000,"days":30}`

The response contains your new `RUNAK-...` API key.

## Protected endpoints

`GET /me?api_key=RUNAK-...`

`GET /download?url=AUTHORIZED_URL&type=audio&api_key=RUNAK-...`

`GET /stream/ID?type=audio&api_key=RUNAK-...`

The download/stream routes intentionally contain a provider adapter boundary rather than copying another site's backend or bypassing copyright/access controls. Connect them to a music/media provider you are authorized to use.
