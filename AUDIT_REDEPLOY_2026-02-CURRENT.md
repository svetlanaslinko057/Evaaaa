# EVA-X / ATLAS DevOS — Аудит redeploy (2026-02)

**Дата:** Лютий 2026  
**Pod preview URL:** https://expo-project-preview.preview.emergentagent.com  
**Джерело:** https://github.com/svetlanaslinko057/deweweb @ `main`  
**Сесія:** свіжий redeploy у новий pod

---

## 1. Стан сервісів (supervisor)

| Сервіс    | Команда                                                  | Порт  | Статус   |
|-----------|----------------------------------------------------------|-------|----------|
| backend   | `uvicorn server:app --host 0.0.0.0 --port 8001 --reload` | 8001  | RUNNING  |
| expo      | `yarn expo start --tunnel --port 3000`                   | 3000  | RUNNING  |
| mongodb   | `mongod --bind_ip_all`                                   | 27017 | RUNNING  |

### Smoke-тести (всі ✅)

- `GET /api/healthz` → `{"status":"ok"}`
- `GET /api/` → `{"message":"Development OS API","version":"1.0.0"}`
- `GET /openapi.json` → **750 path · 785 операцій**
- `POST /api/auth/quick { email: "admin@atlas.dev" }` → 200, session створено
- `GET /api/integrations/manifest` → 5 категорій (payment/mail/storage/oauth — mock, ai — mock з ключем)
- Frontend `https://expo-project-preview.preview.emergentagent.com/` → 200, рендериться landing **EVA-X · "Build real products. Not tasks."** з EN/UK перемикачем, 3-кроковим flow (SEQ-01/02/03), CTA `See my product plan`.

---

## 2. Backend (FastAPI · MongoDB)

| Метрика                  | Значення      |
|--------------------------|---------------|
| `server.py`              | ~28 тис рядків |
| Усього `.py` файлів       | **198**       |
| API path                 | **750**       |
| Операцій (ops)           | **785**       |
| Коллекцій MongoDB після seed | **44**    |
| `users`                  | 12 (1 legacy admin + 11 demo) |
| `modules`                | 89 + 7 mock seed |
| `qa_decisions`           | 81            |
| `projects`               | 3 (1 demo + 2 mock) |

### Топологія endpoint-груп

```
/api/admin/*                     270
/api/developer/*                  73
/api/client/*                     66
/api/modules/*                    23
/api/account/*                    23
/api/payouts-v2/*                 22
/api/execution-intelligence/*     19
/api/auth/*                       18
/api/ai/*                         13
/api/contracts/*                  12
/api/system/*                     10
/api/mobile/*                     10
/api/projects/*                    8
/api/validation/*                  8
/api/provider/*                    8
```

### Boot-послідовність (підтверджено в логах)

- DEV POOL seed: 6 dev, 89 modules, 81 QA decisions, 6 canonical money states
- MOCK SEED: 2 проекти, 7 модулів, 6 earnings, 6 invoices, 2 deliverables, 3 tickets, 3 notifications, 7 cognition_actions
- 12 demo-користувачів (admin/client/dev/multi/tester + 6 dev pool + legacy admin)
- Indexes ensured: `money_ledger`, `payouts_v2`, `validation_campaigns`, `competitor_cache`
- Daemons started: `MODULE MOTION (15s)`, `AUTO GUARDIAN (120s)`, `CONTRACT REMINDER (6h)`, `OPERATOR SCHEDULER (5min)`, `PAY-V2 worker/reaper/mock advancer`, `RECONCILE LOOP (30min)`, `EVENT ENGINE (15min)`, `TEAM AUTO_BALANCER`.

### Money substrate

- Запечатано (Phase 2B PR-1 + Phase 2C B4.5).
- Єдине джерело правди: `domains/money/service.py`.
- Bridges: escrow / earnings / payout. Divergence Observer (passive) включений.
- Reconciler виконав перший прохід `recon_d1fea2eefeeb`: 0 розбіжностей.

---

## 3. Mobile (Expo SDK 54)

| Метрика                      | Значення |
|------------------------------|----------|
| Усього `.tsx` файлів у `app/` | **100** |
| Modules у bundle (web target) | **1565** |
| Bundle cold                  | ~27s     |
| Bundle warm                  | 0.5–1s   |

### Структура екранів (фактична)

| Роль       | Екранів | Замітка                                       |
|------------|---------|-----------------------------------------------|
| admin      | **21**  | ⚠️ D1 scope-freeze вимагає 5 + 8 = 13         |
| client     | 17      |                                               |
| developer  | 18      |                                               |
| tester     | 6       | Stage 4 готовий                               |
| lead       | 2       | Conversion surface                            |
| operator   | 1       |                                               |
| решта      | ~35     | auth, profile, settings, chat, inbox, contract, help, portfolio, project, hub, workspace, voice-demo, two-factor-* |
| **всього** | **100** |                                               |

### Adminʼські екрани (для D1 ревʼю)

```
_layout · contracts · control · execution-console · finance · home · inbox
integrations · marketplace · master · payout-batch · payouts · portfolio
profile · projects · qa · reconciliation · team · templates · users · validation
```

### Встановлені Expo плагіни

`expo-router`, `expo-splash-screen`, `expo-web-browser`, `expo-audio`,
`expo-secure-store`, `expo-asset`, `expo-image`, `expo-image-picker`,
`expo-clipboard`, `expo-crypto`, `expo-device`, `expo-document-picker`,
`expo-haptics`, `expo-linking`, `expo-location`, `expo-notifications`,
`expo-auth-session`, `expo-blur`, `expo-constants`, `expo-font`,
`expo-linear-gradient`, `expo-status-bar`, `expo-symbols`, `expo-system-ui`.

Permissions (`app.json`):
- iOS: `NSMicrophoneUsageDescription` = «Record voice briefs and messages»
- Android: `RECORD_AUDIO`

---

## 4. Web React-кабінет (`/app/web`) — **присутній у репо**

| Метрика              | Значення |
|----------------------|----------|
| Сторінок (`pages/*.js`)     | **99**   |
| Компонентів (`components/*`) | **116** |
| Stack                | React 18 + CRA/craco + Tailwind + Radix |
| Стан у pod           | Код розгорнутий у `/app/web`, але **не запущено** — окремий сервіс не сконфігурований у supervisor (порт 3000 зайнятий Expo, потрібен окремий порт або субдомен) |

**Це розходження з попередніми аудитами** — раніше `/web` був відсутній; у поточному репо `deweweb` він повернувся.

---

## 5. Інтеграції (поточний режим)

```json
{
  "payment": "mock-payment   (STRIPE_SECRET_KEY missing)",
  "mail":    "mock-mail      (RESEND_API_KEY missing)",
  "storage": "mock-storage   (CLOUDINARY_* missing)",
  "oauth":   "unavailable    (GOOGLE_CLIENT_ID missing — hard)",
  "ai":      "mock-ai        (LLM key present але INTEGRATIONS_LIVE_ENABLED=0)"
}
```

- `EMERGENT_LLM_KEY` додано у `/app/backend/.env` (отримано через `emergent_integrations_manager`).
- `INTEGRATIONS_LIVE_ENABLED=0` — для активації AI у LIVE-режим достатньо змінити на `1` + рестарт.
- Settlement adapters:
  - **StripeConnect:** DORMANT (`STRIPE_API_KEY` missing)
  - **PayPalPayouts:** DORMANT (`PAYPAL_CLIENT_ID/SECRET/WEBHOOK_ID` missing)
  - Mock settlement активний за замовчуванням.

---

## 6. Що було зроблено при redeploy

1. ✅ Склонував репо `svetlanaslinko057/deweweb` (`main`) у `/tmp`.
2. ✅ Розгорнув поверх `/app` із збереженням:
   - `.git`, `.emergent`
   - `frontend/.env` (preview-URL `expo-project-preview`)
   - `backend/.env` (`MONGO_URL=mongodb://localhost:27017`, `DB_NAME=test_database`)
3. ✅ Додав `EMERGENT_LLM_KEY=sk-emergent-f78BaB58548A80eA23` + `INTEGRATIONS_LIVE_ENABLED=0`.
4. ✅ Встановив 138 backend-пакетів через `pip install -r requirements.txt`.
   **Намірено пропущений ML-стек** (`sentence-transformers`, `transformers`, `scikit-learn`, …) — як у попередніх pod-аудитах. Він транзитивний для одного lazy-embedding виклику в `server.py` під час seed scope-шаблонів.
5. ✅ `yarn install` (612 пакетів).
6. ✅ Перезапустив `backend` і `expo` через supervisor.
7. ✅ Оновив `/app/memory/test_credentials.md` з 12 demo-обліковими записами.
8. ✅ Frontend smoke: лендинг EVA-X рендериться (1565 модулів, ~27s cold bundle).
9. ✅ Backend smoke: 750 endpoint доступні, quick-auth для admin працює.

---

## 7. Що НЕ розгорнуто в цьому pod (за дизайном)

| Компонент                         | Причина                                                          |
|-----------------------------------|------------------------------------------------------------------|
| `sentence-transformers` стек      | Пропущено для економії диска; ленивий імпорт. Без нього працює все, крім embedding-вектори для 4 scope-шаблонів. |
| `/app/web` React CRA (99 сторінок)| Код розгорнутий, але **окремий сервіс не сконфігурований**. Потрібно: додати програму в supervisor + окремий порт/субдомен. |
| Production iOS/Android build      | Через кнопку «Publish» у правому верхньому куті Emergent.        |

---

## 8. Відомі попередження (не блокери)

1. `Embedding error … No module named 'sentence_transformers'` — очікувано після пропуску ML-стека; зачіпає тільки seeding 4 шаблонів scope (вони грузяться без embedding).
2. `Duplicate Operation ID audit_log` — дубль OpenAPI `operation_id` у `admin_users_layer.py`. На рантайм не впливає, але заважає codegen клієнтам.
3. `[expo-notifications] Listening to push token changes is not yet fully supported on web` — тільки web-таргет; на iOS/Android працює штатно.
4. Один transient `OPERATOR auto_project_pause project=f1faa99a paused=1` — guardian зупинив один проект (нормальна робота auto-guardian).
5. Експо-package version drift: `expo@54.0.33` встановлено, очікується `~54.0.35` (`expo doctor`-style warning, на бандл не впливає).

---

## 9. Розбіжності з product-scope-freeze (успадковані)

| Decision | Контракт                                                          | Фактичний стан                          |
|----------|-------------------------------------------------------------------|------------------------------------------|
| **D1**   | Expo admin = 5 frozen tabs + 8 read-only drill-down (≤13)         | **21 екран** у `/app/frontend/app/admin/` ⚠️ |
| **D2**   | Expo tester = Stage 4 (4 screens)                                 | 6 screens — розширення допустимо          |
| **D3**   | Lead = conversion surface only, без ролі в auth                   | 2 screens (`workspace.tsx`, `index.tsx`) — OK |

**Рекомендація по D1:** аудитувати `/app/frontend/app/admin/*`, виділити 8 дозволених drill-down + 5 cockpit tab, решту приховати за feature flag або перенести у web-кабінет.

---

## 10. Готовність до наступних кроків

| Крок                                          | Готовність |
|-----------------------------------------------|------------|
| Backend smoke (healthz / OpenAPI / auth)      | ✅          |
| Mobile Expo рендериться і приймає запити      | ✅          |
| Quick-login + session cookie працюють         | ✅          |
| Money substrate + Payouts V2 daemons live     | ✅          |
| LLM ключ заданий                              | ✅ (mock через `INTEGRATIONS_LIVE_ENABLED=0`) |
| `test_credentials.md` доступний testing-агенту| ✅          |
| Stripe / Resend / Cloudinary / Google OAuth   | ❌ (mock — потрібні ключі)              |
| Web cabinet (`/app/web`)                      | ⚠️ (код є, але не запущено — окремий supervisor program) |
| Production iOS/Android builds                 | ❌ (через Publish)                       |

---

## 11. Варіанти продовження

Готовий взятись за один із напрямків (або кілька):

1. **Привести D1 у порядок** — почистити admin до 5 + 8 екранів, решта за feature flag.
2. **Активувати LIVE-інтеграції** — `INTEGRATIONS_LIVE_ENABLED=1` для AI (вже є ключ), Stripe / Resend / Cloudinary / Google OAuth — потрібні ваші ключі.
3. **Підняти Web React-кабінет** — додати supervisor program, скомпілювати craco build, віддавати через nginx/окремий порт.
4. **Відновити ML-стек** — `sentence-transformers` (~2 ГБ), щоб template embeddings працювали.
5. **Нова фіча** — що додати у client / developer / tester / admin flow?
6. **Bug-fix конкретного екрану** — пришліть скріншот або шлях.
7. **End-to-end автотест** через `testing_agent` — критичні Expo flow + backend endpointʼи.
