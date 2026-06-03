# EVA-X / ATLAS DevOS — Redeploy & Аудит (fresh pod)

**Дата:** 2026-06-03
**Pod preview URL:** https://mobile-app-expo-21.preview.emergentagent.com
**Источник:** https://github.com/svetlanaslinko057/cwecwe2 @ `main`
**Commit:** `1430ea7` — *EVA-X / ATLAS DevOS: full redeploy + UI/UX i18n fixes*

---

## 1. Состояние сервисов

| Сервис    | Команда                                                  | Порт  | Статус   |
|-----------|----------------------------------------------------------|-------|----------|
| backend   | `uvicorn server:app --host 0.0.0.0 --port 8001 --reload` | 8001  | RUNNING  |
| frontend  | `yarn start` → `expo start --web --port 3000`            | 3000  | RUNNING  |
| mongodb   | `mongod --bind_ip_all`                                   | 27017 | RUNNING  |

### Smoke (✅ все пройдены)

- `GET /api/healthz` → `{"status":"ok"}` (200)
- `GET /api/` → `{"message":"Development OS API","version":"1.0.0"}` (200)
- `GET /openapi.json` → **750 путей · 785 операций**
- `POST /api/auth/quick {"email":"admin@atlas.dev"}` → 200, `user_id=user_c228489dbe47`
- Frontend (preview URL `/`) → 200, **EVA-X лендинг** «Build real products. Not tasks.» рендерится корректно (EN/UK switcher, SEQ-01/02/03, CTA «See my product plan»)
- Backend через preview URL `/api/healthz` → 200

---

## 2. Backend (FastAPI · MongoDB)

| Метрика                  | Значение      |
|--------------------------|---------------|
| `server.py`              | **28 359** строк |
| Всего `.py` файлов       | **198** (154 без `tests/`) |
| API endpoints (paths)    | **750**       |
| Операций (ops)           | **785**       |
| Коллекций MongoDB после seed | **43**    |
| `users`                  | 12 (2 admin + 10 demo) |
| `modules`                | 99            |
| `qa_decisions`           | 105           |
| `projects`               | 3             |
| `invoices`               | 6             |
| `system_actions_log`     | 51            |
| `cognition_overrides`    | 34            |
| `money_ledger_events`    | 30            |

### Boot-последовательность (проверено)

- ✅ DEV POOL seed: **6 devs, 89 modules, 81 QA decisions, 6 canonical money states**
- ✅ MOCK SEED: 2 projects, 7 modules, 6 earnings, 6 invoices, 2 deliverables, 3 tickets, 3 notifications, 7 cognition_actions
- ✅ SEED_REPLAY: `boot_replay_v1` batch — 70 events (overrides:16, qa_fail:14, reassign:19, overload:12, suppression:9)
- ✅ Demo-пользователей: 12 (2 admin + 6 dev pool + 4 quick-access)
- ✅ Indexes ensured: `money_ledger`, `payouts_v2`, `validation_campaigns`, `competitor_cache`
- ✅ Daemons running: `MODULE MOTION (15s)`, `AUTO GUARDIAN (120s)`, `CONTRACT REMINDER (6h)`, `OPERATOR SCHEDULER (5min)`, `PAY-V2 worker/reaper/mock advancer`, `RECONCILE LOOP (30min)`, `EVENT ENGINE (15min)`
- ✅ Money substrate sealed (Phase 2B PR-1 + Phase 2C B4.5); MoneyService initialised; Divergence Observer passive ON

### Topology endpoint-групп (избр.)

```
/api/admin/*                     ~265
/api/developer/*                  ~73
/api/client/*                     ~66
/api/modules/*                    ~23
/api/account/*                    ~23
/api/payouts-v2/*                 ~22
/api/execution-intelligence/*     ~19
/api/auth/*                       ~18
/api/ai/*                         ~13
/api/contracts/*                  ~12
/api/system/*                     ~10
/api/mobile/*                     ~10
```

---

## 3. Mobile (Expo SDK 54) — `/app/frontend`

| Метрика              | Значение |
|----------------------|----------|
| `.tsx` файлов в `app/` | **100** |

### Структура экранов по ролям

| Роль       | Экранов | Заметка                                       |
|------------|---------|-----------------------------------------------|
| admin      | **21**  | ⚠️ D1 scope-freeze требует 5 + 8 = 13         |
| client     | 20      |                                               |
| developer  | 18      |                                               |
| tester     | 6       | Stage 4 готов                                 |
| lead       | 2       | Conversion surface                            |
| operator   | 1       |                                               |
| прочее     | 32      | auth, profile, settings, chat, inbox, contract, help, portfolio, project, hub, workspace, voice-demo, two-factor-* и т.д. |
| **итого**  | **100** |                                               |

### Установленные плагины Expo (24 шт.)

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

## 4. Web Cabinet (React CRA · `/app/web`) — НЕ ЗАПУЩЕН в этом pod

| Метрика              | Значение |
|----------------------|----------|
| Pages (`src/pages/`) | **99**   |
| Components           | **116**  |
| Layouts              | 4        |
| Всего .js/.jsx файлов| **235**  |

**Замечание:** Web cabinet присутствует в репозитории, но supervisor настроен на запуск
только Expo (`yarn start` в `/app/frontend`). Чтобы поднять web-кабинет, нужен либо
второй pod, либо изменение supervisor конфига + смена `frontend` на `web` (взаимо­исключаются
по порту 3000). Web cabinet — это полноценный backoffice/admin UI на React 18 + TS.

---

## 5. Интеграции (текущий режим — все mock)

```json
{
  "payment":    { "mode": "mock", "policy": "hard", "reason": "STRIPE_SECRET_KEY missing" },
  "mail":       { "mode": "mock", "policy": "soft", "reason": "RESEND_API_KEY missing" },
  "storage":    { "mode": "mock", "policy": "soft", "reason": "CLOUDINARY_* missing" },
  "oauth":      { "mode": "unavailable", "policy": "hard", "reason": "GOOGLE_CLIENT_ID missing" },
  "ai":         { "mode": "mock", "policy": "soft", "reason": "EMERGENT_LLM_KEY / OPENAI / ANTHROPIC missing" },
  "settlement": { "mode": "mock" }
}
```

- `INTEGRATIONS_LIVE_ENABLED=0` — external boundary прибит к mocks.
- StripeConnect adapter: **DORMANT** (`STRIPE_API_KEY` missing)
- PayPalPayouts adapter: **DORMANT** (`PAYPAL_CLIENT_ID/SECRET/WEBHOOK_ID` missing)
- Чтобы включить LIVE: добавить ключи в `/app/backend/.env` + `INTEGRATIONS_LIVE_ENABLED=1`.

---

## 6. Что было сделано при redeploy

1. ✅ Склонирован `svetlanaslinko057/cwecwe2` @ `main` в `/tmp/repo`.
2. ✅ Сохранены `/app/backend/.env` (`MONGO_URL`, `DB_NAME=test_database`) и
   `/app/frontend/.env` (`REACT_APP_BACKEND_URL=https://mobile-app-expo-21.preview.emergentagent.com`).
3. ✅ `/app/{backend,frontend,web,packages,memory,tests,test_reports}` заменены содержимым репозитория.
4. ✅ Установлены backend-зависимости из `requirements.txt` (138 пакетов).
   ML-стек (`sentence-transformers`, `transformers`, `scikit-learn`, `scipy`, `networkx`,
   `sympy`, `tokenizers`, `safetensors`, `huggingface_hub`, `joblib`, `threadpoolctl`)
   **отсутствует в `requirements.txt`** этого среза — как и в предыдущих pod-аудитах
   ради экономии диска. Воздействие: только lazy embedding-вызов (`server.py:~17352`)
   при seeding 4 шаблонов scope (см. п.8).
5. ✅ `yarn install` для Expo (641 пакетов, single-process на :3000).
6. ✅ Перезапущены `backend` и `frontend` через supervisor — оба `RUNNING`.
7. ✅ Создан `/app/memory/test_credentials.md` со списком 12 demo-аккаунтов.
8. ✅ Smoke-тесты пройдены: `/api/healthz`, `/api/`, `/openapi.json`, quick auth,
   frontend через preview URL.

---

## 7. Известные предупреждения (не блокеры)

1. `Embedding error … No module named 'sentence_transformers'` — ожидаемо после
   пропуска ML-стека; затрагивает только seeding 4 шаблонов scope (`SaaS Dashboard`,
   `E-Commerce Store`, `Fitness & Wellness App`, `Online Marketplace`) — они грузятся
   без embedding-векторов.
2. `Duplicate Operation ID audit_log_api_admin_audit_log_get` — дубль OpenAPI
   `operation_id` в `admin_users_layer.py`. На рантайм не влияет, но мешает
   codegen-клиентам.
3. `[expo-notifications] Listening to push token changes is not yet fully supported on web`
   — только web-таргет; на iOS/Android работает штатно.
4. Browserslist `caniuse-lite is 6 months old` — рекомендуется `npx update-browserslist-db@latest`
   (cosmetic).

---

## 8. Расхождения с product-scope-freeze (унаследованы из прошлых аудитов)

| Decision | Контракт                                                          | Фактическое состояние                          |
|----------|-------------------------------------------------------------------|------------------------------------------------|
| **D1**   | Expo admin = 5 frozen tabs + 8 read-only drill-down (≤13)         | **21 экран** в `/app/frontend/app/admin/` ⚠️    |
| **D2**   | Expo tester = Stage 4 (4 screens)                                 | 6 screens — расширение допустимое              |
| **D3**   | Lead = conversion surface only, без роли в auth                   | 2 screens (`workspace.tsx`, `index.tsx`) — OK |

**Рекомендация по D1:** аудитировать `/app/frontend/app/admin/*`, выделить 8 разрешённых
drill-down + 5 cockpit tabs, остальное скрыть за feature flag либо унести в web-кабинет.

---

## 9. Готовность к следующим шагам

| Шаг                                          | Готов? |
|----------------------------------------------|--------|
| Backend smoke (healthz / OpenAPI / auth)     | ✅     |
| Mobile Expo рендерится и принимает запросы   | ✅     |
| Quick-login + session cookie работают        | ✅     |
| Money substrate + Payouts V2 daemons live    | ✅     |
| `test_credentials.md` доступен testing-агенту| ✅     |
| LLM (Claude / GPT / Gemini) через Emergent   | ⚠️ Требуется `EMERGENT_LLM_KEY` в `/app/backend/.env` |
| Stripe / Resend / Cloudinary / Google OAuth  | ❌ (mock — нужны ключи)                                |
| Web cabinet (`/app/web`)                     | ❌ (код есть, но не запущен — требует доп.настройки)   |
| ML-стек (`sentence-transformers`)            | ❌ (не в requirements.txt — embedding 4 шаблонов выкл.)|
| Production iOS/Android builds                | ❌ (через Publish)                                     |

---

## 10. Что предлагается на следующий шаг

Готов продолжить — выбирайте направление:

1. **Привести D1 в порядок** — почистить admin до 5 + 8 экранов, спрятать лишнее за feature flag.
2. **Активировать live-интеграции:**
   - `EMERGENT_LLM_KEY` (бесплатно, могу взять автоматически) — включит Claude / GPT / Gemini.
   - Stripe / Resend / Cloudinary / Google OAuth — нужны ВАШИ ключи.
   - Поднимем `INTEGRATIONS_LIVE_ENABLED=1`.
3. **Поднять Web Cabinet** — нужно решить: либо отдельный pod, либо переключить supervisor с Expo на `/app/web` (взаимоисключающе).
4. **End-to-end тест** через `testing_agent` — автопрогон критичных Expo flow + backend endpoint'ов (admin/client/developer/tester user stories).
5. **Восстановить ML-стек** — `sentence-transformers` (~2 ГБ), чтобы template embeddings работали.
6. **Новая фича / багфикс конкретного экрана** — пришлите путь / скриншот / тех. задание.

---

## 11. Файловая карта (на 2026-06-03)

```
/app
├── backend/         154 .py + tests/ — FastAPI, 750 endpoints, 28k LOC server.py
├── frontend/        Expo SDK 54, 100 .tsx, runs at :3000
├── web/             React CRA, 99 pages + 116 components — NOT RUNNING
├── packages/        design-system, runtime-client (workspace pkgs)
├── memory/          PRD.md, PRD_promo_banner.md, test_credentials.md
├── tests/           __init__.py (testing agent root)
├── test_reports/    iteration-* JSON выдачи testing agent
├── AUDIT_*.md       история redeploy-аудитов (8 файлов)
└── .env files       backend (MONGO_URL, DB_NAME) + frontend (REACT_APP_BACKEND_URL)
```
