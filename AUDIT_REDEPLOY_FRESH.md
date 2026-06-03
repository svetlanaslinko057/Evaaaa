# EVA-X / ATLAS DevOS — Свежий аудит после redeploy

**Источник:** https://github.com/svetlanaslinko057/cbejwb23
**Pod preview URL:** https://mobile-app-expo-20.preview.emergentagent.com
**Режим интеграций:** `INTEGRATIONS_LIVE_ENABLED=0` (MOCK boundary)

---

## 1. Состояние сервисов

| Сервис   | Команда                                                   | Порт  | Статус  |
|----------|-----------------------------------------------------------|-------|---------|
| backend  | `uvicorn server:app --host 0.0.0.0 --port 8001 --reload`  | 8001  | RUNNING |
| expo     | `yarn expo start --tunnel --port 3000`                    | 3000  | RUNNING |
| mongodb  | `mongod --bind_ip_all`                                    | 27017 | RUNNING |

### Smoke (✅ все пройдены)
- `GET /api/healthz` → `{"status":"ok"}`
- `GET /api/` → `{"message":"Development OS API","version":"1.0.0"}`
- `GET /openapi.json` → **743 пути**
- `POST /api/auth/quick {email: admin@atlas.dev}` → 200, выдан session cookie
- `GET /api/integrations/manifest` → manifest по 6 категориям
- Frontend `/` → HTTP 200, рендерится лендинг **EVA-X** «Build real products. Not tasks.» (EN/UK, 3-шаговый flow, CTA)

---

## 2. Backend (FastAPI · MongoDB)

| Метрика                      | Значение      |
|------------------------------|---------------|
| `server.py`                  | 28 351 строка |
| Всего `.py` файлов           | **197**       |
| API endpoints (paths)        | **743**       |
| Коллекций MongoDB после seed | **43**        |

### Топология (top groups)
```
/api/admin/*                     265
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
```

### Сидинг (boot, проверено)
- users: 12 (2 admin + client + dev + tester + multi + 6 dev pool)
- projects: 3 · modules: 99 · qa_decisions: 105
- invoices: 6 · deliverables: 2 · notifications: 11
- Daemons up: MODULE MOTION (15s), AUTO GUARDIAN (120s), CONTRACT REMINDER (6h),
  OPERATOR SCHEDULER (5min), PAY-V2 worker/reaper/mock advancer, RECONCILE (30min),
  EVENT ENGINE (15min), AUTO_BALANCER, AUTONOMY scan.

---

## 3. Mobile (Expo SDK 54)

| Метрика                | Значение |
|------------------------|----------|
| `.tsx` файлов в `app/` | **100**  |
| Modules в web bundle   | **1564** |

| Роль      | Экранов |
|-----------|---------|
| admin     | 21      |
| client    | 20      |
| developer | 18      |
| tester    | 6       |
| lead      | 2       |
| operator  | 1       |
| прочее    | 32      |

Backend URL резолвится из `EXPO_PUBLIC_BACKEND_URL` (`frontend/.env`) — корректно.

---

## 4. Интеграции (текущий режим)

| Категория  | Mode        | Policy | Причина                                            |
|------------|-------------|--------|----------------------------------------------------|
| payment    | mock        | hard   | STRIPE_SECRET_KEY missing                          |
| mail       | mock        | soft   | RESEND_API_KEY missing                             |
| storage    | mock        | soft   | CLOUDINARY_* missing                               |
| oauth      | unavailable | hard   | GOOGLE_CLIENT_ID missing                           |
| ai         | mock        | soft   | LLM key present, но `INTEGRATIONS_LIVE_ENABLED!=1` |
| settlement | mock        | —      | StripeConnect / PayPal dormant                     |

**EMERGENT_LLM_KEY установлен** в `/app/backend/.env`.

---

## 5. Ключевые находки этого аудита

### ⚠️ F1 — AI заблокирован общим master-switch
В этом репозитории (`cbejwb23`) AI-адаптер привязан к **единому** флагу
`INTEGRATIONS_LIVE_ENABLED` (Этап 5.0, `integrations/live_adapters.py:is_live_enabled`).
Даже при заданном `EMERGENT_LLM_KEY` AI остаётся в MOCK, пока флаг = 0.
Per-AI override отсутствует.
**Последствие:** включить только AI нельзя — флип флага активирует ВСЕ адаптеры,
а payment/oauth имеют policy=hard и без ключей станут `unavailable` (могут ломать flow).
**Рекомендация:** либо добавить отдельный `AI_LIVE_ENABLED` флаг, либо включать
live только когда готовы все hard-ключи (Stripe + Google).

### ⚠️ F2 — Утечка `password_hash` в `/api/auth/quick`
`server.py:2642` делает `find_one({email}, {"_id": 0})` и возвращает весь документ
пользователя, включая поле `password_hash` (bcrypt) в JSON ответа.
**Рекомендация:** исключать `password_hash` из проекции / response-модели.

### ℹ️ F3 — Duplicate OpenAPI operation_id
`audit_log` в `admin_users_layer.py` дублирует `operation_id`. На рантайм не влияет,
мешает codegen-клиентам. (warning при boot)

### ℹ️ F4 — sentence-transformers пропущен (by design)
`Embedding error for template …: No module named 'sentence_transformers'` —
ML-стек намеренно не установлен (экономия диска, lazy-импорт). Влияет только на
embedding 4 scope-шаблонов; всё остальное работает.

### ℹ️ F5 — Ngrok transient reconnect
При холодном старте Expo тоннель пару раз переподключается
(`ngrok tunnel took too long`) — восстанавливается автоматически, сейчас `Tunnel ready`.

---

## 6. Не развёрнуто в этом pod
| Компонент                       | Причина                                  |
|---------------------------------|------------------------------------------|
| `sentence-transformers` стек    | Пропущен намеренно (lazy import)          |
| `/web` React-кабинет            | Нет в этом репозитории                    |
| Production iOS/Android builds   | Через кнопку «Publish»                    |

---

## 7. Готовность к следующим шагам
- Backend smoke / OpenAPI / auth — ✅
- Mobile рендерится, session cookie работает — ✅
- Money substrate + Payouts V2 daemons — ✅
- LLM key установлен — ✅ (AI live ждёт master-switch, см. F1)
- Stripe / Resend / Cloudinary / Google OAuth — ❌ mock (нужны ключи)
