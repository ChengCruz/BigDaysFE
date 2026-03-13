# Backend: Migrate Refresh Token to HttpOnly Cookie

## Why

Currently the refresh token is stored in `localStorage` on the frontend, which is accessible by any JavaScript running on the page. Moving it to an `HttpOnly` cookie means JavaScript can **never** read or steal it — even in an XSS attack.

---

## What the Backend Needs to Change

### 1. Login — `POST /User/Login`

**Stop** returning `refreshToken` in the JSON body.
**Instead**, set it as a `Set-Cookie` header in the response:

```
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/User/RefreshToken; Max-Age=2592000
```

| Attribute | Value | Reason |
|---|---|---|
| `HttpOnly` | — | JS cannot access it |
| `Secure` | — | Only sent over HTTPS |
| `SameSite=Strict` | — | Blocks CSRF from cross-site requests |
| `Path=/User/RefreshToken` | — | Cookie only sent to the refresh endpoint, not all requests |
| `Max-Age` | 30 days (or match token TTL) | Persistent session |

The JSON response body should still return `accessToken` and `expiresIn`, but **remove `refreshToken`** from it.

**Before:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "dGhp...",
  "expiresIn": 900,
  "userGuid": "...",
  "role": 1
}
```

**After:**
```json
{
  "accessToken": "eyJ...",
  "expiresIn": 900,
  "userGuid": "...",
  "role": 1
}
```

---

### 2. Refresh Token — `POST /User/RefreshToken`

**Stop** accepting `refreshToken` in the request body.
**Instead**, read it from the cookie (it will be sent automatically by the browser).

**Before (request body):**
```json
{ "refreshToken": "dGhp..." }
```

**After:** No body needed — read from `Request.Cookies["refreshToken"]`.

On success, **rotate the refresh token** — issue a new one and set a new `Set-Cookie` header (same attributes as login). Return only the new `accessToken` in the JSON body.

---

### 3. Logout — `POST /User/Logout`

Clear the cookie by setting it with `Max-Age=0`:

```
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/User/RefreshToken; Max-Age=0
```

---

### 4. CORS — Allow Credentials

For cookies to be sent cross-origin, the backend must:

```
Access-Control-Allow-Origin: https://yourdomain.com   ← must be explicit, NOT *
Access-Control-Allow-Credentials: true
```

---

## What the Frontend Will Change (after BE is ready)

- Remove all `localStorage.getItem/setItem/removeItem("refreshToken")` calls
- The `POST /User/RefreshToken` request body will be empty (cookie is sent automatically)
- No other changes — access token handling stays the same (in-memory)

---

## Summary of Cookie Attributes

```
Set-Cookie: refreshToken=<value>; HttpOnly; Secure; SameSite=Strict; Path=/User/RefreshToken; Max-Age=2592000
```
