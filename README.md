# Shit Chat

Aplikasi chat real-time: **Next.js 16 (App Router) + React 19** frontend, **Go 1.26 + Gin** backend, **PostgreSQL** database, komunikasi real-time via **WebSocket** (gorilla/websocket) dengan fallback polling.

---

## 1. Arsitektur

```
┌─────────────────┐     REST (cookie auth)     ┌──────────────────────────┐
│   Frontend      │ ◄────────────────────────► │   Backend (Go + Gin)     │
│   Next.js 16    │                            │  cmd/api/main.go         │
│   localhost:3000│     WebSocket (real-time)  │  internal/               │
│                 │ ◄────────────────────────► │    delivery/http  (REST) │
└─────────────────┘                            │    delivery/ws    (WS)   │
                                               │    usecase        (logic)│
                                               │    repository     (SQL)  │
                                               │    domain         (types)│
                                               │  pkg/                   │
                                               │    database      (pg)   │
                                               │    jwt           (HS256)│
                                               └──────────┬───────────────┘
                                                          │
                                                   ┌──────▼──────┐
                                                   │ PostgreSQL  │
                                                   │ shit_chat   │
                                                   └─────────────┘
```

**Lapisan mengalir 1 arah**: `delivery → usecase → repository → DB`. Layer bawah tidak pernah tahu layer atas. Semua data antar-layer via struct `internal/domain`.

### Struktur direktori

| Path | Isi |
|------|-----|
| `backend/cmd/api/main.go` | Entry point — semua wiring (DB, limiter, controller, hub) |
| `backend/internal/delivery/http/` | REST controllers, router, middleware auth |
| `backend/internal/delivery/ws/` | WebSocket: hub, client, handler, protocol |
| `backend/internal/usecase/` | Business logic + validasi |
| `backend/internal/repository/` | Query SQL murni |
| `backend/internal/domain/` | Shared types (`Chat`, `Message`, `ChatSummary`) |
| `backend/pkg/database/` | Koneksi Postgres + migration runner (go:embed) |
| `backend/pkg/jwt/` | Generate/validate JWT HS256 |
| `frontend/src/lib/ws.ts` | WebSocket singleton + `useChatSocket()` hook |
| `frontend/src/lib/swr.ts` | SWR fetcher + `useFetch`/`useMutation` wrappers |
| `frontend/src/service/chat.service.ts` | API hooks + types |
| `frontend/src/screens/chat/` | Halaman chat + komponen |

---

## 2. Setup & Menjalankan

### Prasyarat
- Go ≥ 1.26
- Node.js ≥ 20 (atau Bun — project pakai `bun`)
- PostgreSQL berjalan di `127.0.0.1:5432`

### Database
```sql
CREATE DATABASE shit_chat;
```
Kredensial default di `backend/cmd/api/main.go`:
```
Host: 127.0.0.1  Port: 5432  User: postgres  Password: root  DB: shit_chat
```
Migrations jalan **otomatis saat backend start** (`ApplyMigrations` — idempotent, file SQL embedded di `backend/pkg/database/migrations/`).

### Backend
```bash
cd backend
go run ./cmd/api        # port 8080
```

### Frontend
```bash
cd frontend
bun install
bun run dev             # port 3000
```
Env (opsional — ada default):
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 3. Autentikasi

- **JWT HS256** (`pkg/jwt`), secret: `kunci-rahasia-super-aman` di `pkg/jwt/jwt.go`
- Token disimpan di **HttpOnly cookie** bernama `token`, domain `localhost`, 7 hari
- HttpOnly → tidak bisa dibaca JS → aman dari XSS
- Middleware `RequireAuth()` (`delivery/http/middleware.go`) baca cookie → validasi → inject `user_id` ke Gin context
- `CurrentUserID(c)` — controller mengambil user ID dari context
- **Penting**: cookie domain `localhost` — frontend harus diakses via `localhost:3000`, bukan `127.0.0.1:3000`, kalau tidak cookie tidak terkirim

### Rate limiting (scoped per grup)
| Grup | Limit |
|------|-------|
| Auth (register/login/logout) | 5 request / 10 detik |
| Chat API + WS | 120 request / 10 detik |

---

## 4. REST API

Base: `http://localhost:8080/api/v1`

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| POST | `/register` | – | Body: `{fullname, email, password}` (min 3/8 chars) |
| POST | `/login` | – | Body: `{email, password}` → set cookie |
| POST | `/logout` | – | Hapus cookie |
| GET | `/me` | ✓ | Profil user sendiri |
| GET | `/users?q=` | ✓ | Search user (min 2 chars, exclude self) |
| GET | `/chats` | ✓ | List chat + unread count + last message |
| POST | `/chats` | ✓ | 1:1 `{user_id}` ATAU group `{name, member_ids}` |
| GET | `/chats/:id/messages?before_id=&limit=` | ✓ | History (keyset pagination, max 100) |
| POST | `/chats/:id/read` | ✓ | Mark read (watermark `last_read_at`) |

Response `ChatSummary` (dari `GET /chats`):
```json
{
  "id": 1, "name": null, "is_group": false,
  "other_user": {"id": 2, "fullname": "Bob", "email": "bob@test.com"},
  "other_last_read_at": "2026-08-15T10:00:00Z",
  "last_message": {"id": 5, "chat_id": 1, "sender_id": 2, "sender_name": "Bob", "body": "halo", "created_at": "..."},
  "unread_count": 2,
  "last_read_at": "2026-08-15T09:00:00Z",
  "created_at": "..."
}
```

### Konsep kunci

- **Watermark baca, bukan boolean**: `chat_members.last_read_at` (per user per chat). Unread = pesan `created_at > last_read_at` dari orang lain. Sender selalu auto-mark-read saat kirim (`SendMessage` → `MarkRead`).
- **Badge "Read" 1:1** pakai `other_last_read_at` — watermark **penerima** (field `last_read_at` sendiri tidak berguna untuk receipt karena selalu ter-update saat kirim). Group chat tidak punya read badge.
- **Keyset pagination**: `WHERE id < before_id ORDER BY id DESC LIMIT n` — lebih stabil dari OFFSET saat ada pesan baru masuk.
- **Urutan chat list**: `ORDER BY MAX(messages.created_at) DESC` (fallback `chats.created_at`) — chat paling aktif di atas, termasuk pesan sendiri.
- **1:1 get-or-create**: transaksi cek 2 member → buat kalau belum ada.

---

## 5. WebSocket

Endpoint: `GET /api/v1/ws` (butuh cookie auth — handshake baca cookie yang sama).

### Struktur runtime (`delivery/ws/`)

```
Hub (goroutine Run + sync.RWMutex)
├── rooms:  map[chatID]*Room            → Room.clients: map[userID]map[*Client]struct{}
├── users:  map[userID]map[*Client]struct{}   ← multi-koneksi per user (multi-tab!)
└── presence: map[userID]bool
```

- Satu user bisa punya **banyak koneksi** (multi-tab) — `map[*Client]struct{}` per user. Broadcast menjangkau semua koneksi.
- `register`/`unregister` via channel — diproses serial oleh goroutine `Run()`, tidak ada race.
- `writePump` per client: kirim data dari channel `send` + ping (54s period, 60s pong deadline).
- `Client.send` buffer 256 — kalau penuh, koneksi di-drop (terlalu lambat), bukan block.

### Protocol (JSON, diskriminator `type`)

**Client → Server:**

| Type | Payload | Keterangan |
|------|---------|-----------|
| `message` | `{chat_id, body, temp_id}` | temp_id untuk ack → replace bubble optimistik |
| `typing` | `{chat_id, is_typing}` | throttle di frontend (2s) |
| `read` | `{chat_id, last_read_message_id}` | mark read |
| `join_chat` | `{chat_id}` | join room chat yang dibuat setelah koneksi terbentuk |
| `ping` | – | keepalive |

**Server → Client:**

| Type | Payload | Keterangan |
|------|---------|-----------|
| `ack` | `{temp_id, message}` | pesan ter-persist, ganti bubble pending |
| `message` | `{message: {...}}` | broadcast ke room (exclude sender) |
| `typing` | `{chat_id, user_id, is_typing}` | |
| `read` | `{chat_id, user_id, last_read_message_id}` | dikirim ke **semua** member (termasuk pembaca — untuk clear badge sidebar) |
| `presence` | `{user_id, online}` | |
| `chat_created` | `{chat: ChatSummary}` | chat baru dibuat orang lain → list refresh seketika |
| `error` | `{code, message, temp_id?}` | |
| `pong` | – | balasan ping |

### Alur kirim pesan (persist-then-broadcast)

```
client send {type:"message"}
  → handler.handleMessage
  → chatService.SendMessage (validasi member → INSERT DB → mark sender read)
  → SendToClient ack {temp_id, message}   (pengirim replace bubble optimistik)
  → BroadcastToRoom (semua member lain)
```

**Server adalah source of truth** — persist dulu, broadcast setelah. Kalau DB gagal, kirim `error` dengan `temp_id` agar frontend menandai bubble gagal.

### Room membership

- Saat koneksi terbuka: semua chat user di-load dari DB, client di-join ke semua room.
- Chat dibuat **setelah** koneksi: frontend kirim `join_chat` saat chat dibuka (diverifikasi `IsMember` di DB — client tidak bisa join room orang lain).
- `chat_created` dikirim via `SendToUser` ke semua anggota lain saat `POST /chats` sukses (di `chat_controller.go`, via interface `ChatEventBroadcaster` yang diimplementasi hub).

---

## 6. Frontend — Alur Data

### SWR (`src/lib/swr.ts`)
- `useFetch(path, opts)` → `useSWR` + `fetcher` (GET + `credentials: "include"`). Key `null` = skip fetch.
- `useMutation(path)` → `useSWRMutation`, trigger manual: `trigger({method, body})`.
- `ApiError` membawa `status` untuk cek 401 di komponen.
- Global config: `revalidateOnFocus: false`, `revalidateOnReconnect: true`, `shouldRetryOnError: false`.
- **Jangan** pasang `onError` redirect global di `SWRConfig` — itu juga memicu untuk login/register dan menelan error. Handle 401 per-hook.

### WebSocket singleton (`src/lib/ws.ts`)
- Koneksi **satu global** (module-level), bukan per komponen — semua komponen share.
- Reconnect exponential backoff: 1s → 30s, outbound queue saat putus.
- `useChatSocket()` → `{status, send, subscribe, disconnect}`.
- `subscribe(type, handler)` → return unsubscriber — **wajib** dipanggil di dalam `useEffect` dengan cleanup (jangan di body render — handler menumpuk).
- Status via `useSyncExternalStore` dengan **snapshot cache** — `getSnapshot` harus return referensi sama antar render, kalau tidak infinite loop (`The result of getSnapshot should be cached`).

### Sinkronisasi list chat (sidebar)
```tsx
useEffect(() => {
  const unsubMessage = subscribe("message", () => mutate());
  const unsubRead = subscribe("read", () => mutate());
  const unsubChatCreated = subscribe("chat_created", () => mutate());
  return () => { unsubMessage(); unsubRead(); unsubChatCreated(); };
}, [subscribe, mutate]);
```
Event WS → re-fetch `/chats` → list selalu sinkron real-time. Polling 15s (`refreshInterval`) hanya fallback.

### ChatPane (buka chat)
1. `useChatMessages(chatId)` load history REST
2. `join_chat` dikirim via WS saat chat dipilih
3. History di-merge dengan pesan WS (dedupe by `id`)
4. `read` dikirim (guard `lastReadIdRef` — tidak spam saat revalidate)
5. Pindah chat → state reset (messages, pending, typing)

### Warna anggota group
Hash deterministik nama → 8 warna (`message-bubble.tsx`) — user sama, warna sama di semua client.

---

## 7. Database Schema

```sql
users(
  id BIGSERIAL PK,
  fullname TEXT, email TEXT UNIQUE,
  password TEXT,            -- bcrypt hash
  created_at TIMESTAMPTZ
)

chats(
  id BIGSERIAL PK,
  name TEXT NULL,           -- group name; NULL untuk 1:1
  is_group BOOLEAN,
  created_by BIGINT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ
)

chat_members(
  chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ, -- watermark baca per user per chat
  joined_at TIMESTAMPTZ,
  PRIMARY KEY (chat_id, user_id)
)

messages(
  id BIGSERIAL PK,
  chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
  sender_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  body TEXT,
  created_at TIMESTAMPTZ
)
-- index: messages(chat_id, id)
```

**Perhatian**: migration runner pakai `CREATE TABLE IF NOT EXISTS` — kolom baru TIDAK otomatis ditambah ke tabel lama. Perubahan schema baru harus migration file baru (`migrations/002_xxx.sql`), bukan edit file 001.

---

## 8. Troubleshooting

| Gejala | Penyebab | Fix |
|--------|----------|-----|
| Login gagal / CORS | Backend belum jalan / port beda | `go run ./cmd/api` di `backend/` |
| WS 403 dari Node/test | Origin tidak diizinkan | `CheckOrigin` di `upgrader.go` — kosong/localhost:3000 saja |
| "getSnapshot should be cached" | snapshot() return objek baru tiap render | Lihat `ws.ts` — cached snapshot pattern |
| 2 tab dianggap 1 user | Cookie token sama antar tab | Fitur, bukan bug — multi-koneksi di-support |
| Test 2 akun | Satu browser = satu cookie | Pakai browser beda / incognito |
| Badge unread tidak hilang | Backend lama | Restart backend (kill port 8080) |
| Error build font `JetBrains_Mono` | Font Google gagal di-fetch | Jangan re-add font yang tidak dipakai |
| `pq: column "chat_id" does not exist` | Tabel messages versi lama (schema usang) | Migration lama menimpa — cek `migrations/001_init.sql` |
| Ganti domain (bukan localhost) | Cookie domain hardcoded | Ubah `SetCookie` di auth_controller + CORS + `wsURL()` |

### Restart backend (Windows)
```powershell
netstat -ano | findstr :8080     # cari PID
taskkill /PID <PID> /F
cd backend && go run ./cmd/api
```

---

## 9. Decisi & Deferral Notes

- **Group read receipts** — belum ada (hanya 1:1 via `other_last_read_at`). Perlu per-member watermark di response.
- **Multi-device push** — belum ada; hanya dalam-browser.
- **`Room.clients` multi-koneksi** sudah di-support (multi-tab), tapi belum ada event "device list".
- **Rate limiter** in-memory (`memory.NewStore`) — reset saat restart; pakai Redis store kalau multi-instance.
- **JWT secret** hardcoded — pindah ke env var untuk production.
- **CORS** hardcoded `localhost:3000` — perlu env untuk domain lain.
