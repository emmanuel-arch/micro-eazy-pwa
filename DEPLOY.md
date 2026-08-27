# Deploying Micro Eazy (the PWA)

## Why this file exists

`vercel.json` used to carry its own explanation in a top-level `$comment` array.
**Vercel rejects that.** Its schema validation is strict — unknown top-level keys
fail the build outright, before any code is compiled:

```
Build Failed
The `vercel.json` schema validation failed with the following message:
should NOT have additional property `$comment`
```

That failure is the reason this project served a stale app for days. A build that
never completes does not replace the previous deployment; it leaves it in place.
The domain kept answering, every push looked accepted, and the last *successful*
build stayed live. Nothing about the symptom points at `vercel.json`.

JSON has no comments and Vercel allows no extra keys, so the prose lives here.

---

## The two rewrite rules

### Rule 1 — `/api/*` is PROXIED to the Connected Suite, not redirected

The borrower session is an httpOnly cookie with `SameSite=Lax` (see
`connected-suite/src/lib/portal/session.ts`). A Lax cookie is **not** sent on a
cross-site XHR, so a browser calling `lms.servicesuitecloud.com` directly from
this origin would authenticate on the OTP step and then be anonymous on every
call after it.

A Vercel rewrite proxies server-side: the browser only ever sees this origin, the
`Set-Cookie` lands on this domain, and the session works with no CORS and no
change to the suite.

**Do not turn this into a redirect.** A redirect puts the other origin in the
browser's address bar and the cookie problem comes straight back.

### Rule 2 — everything else falls back to the SPA shell

Rewrites run *after* the filesystem check on Vercel, so real files (assets, icons,
the manifest, `sw.js`) are served before this rule is ever consulted. It only
catches client-side routes like `/crunch` or `/loan/8812` on a hard reload.

Order matters: `/api` is matched first.

> ⚠ One consequence worth knowing. Because this rule returns `index.html` with a
> **200** for any unmatched path, a missing file does not 404 — it returns an HTML
> document. A stale `index.html` asking for a hashed bundle that no longer exists
> therefore gets HTML with `Content-Type: text/html`, and the module script fails
> to parse instead of failing to load. That is why the cache headers below matter.

---

## The cache headers

`/sw.js`, `/service-worker.js` and `/index.html` are all served
`max-age=0, must-revalidate`.

The service worker scripts must revalidate or a browser can hold a registration
for up to 24 hours, which is long enough for a deploy to look like it did nothing.
`index.html` must revalidate because it is the document that names the current
hashed bundles; a cached copy pins the app to a build that has been deleted.

Hashed assets under `/assets/` are *not* listed here on purpose. They are
immutable by construction and Vercel already caches them correctly.

---

## Checklist for a release

1. `npm run build` locally — a build that fails here fails on Vercel.
2. Confirm `vercel.json` still parses and has **no key outside**
   `rewrites`, `headers`, `redirects`, `cleanUrls`, `trailingSlash`, `functions`,
   `crons`, `regions`, `buildCommand`, `outputDirectory`, `framework`,
   `installCommand`, `devCommand`, `ignoreCommand`, `images`, `github`.
3. Push. **Then open the Vercel deployment and confirm it says Ready, not Error.**
   This is the step that was missing. A green `git push` says nothing about
   whether the deployment built.
4. Hard-reload the live URL and check the app version actually changed.
