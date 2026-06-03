# WEB PLATFORM — восстановление (React SPA)

## Что произошло
Веб-сайт (React 19 · CRA + craco · Tailwind · Radix, 98 страниц / 128 маршрутов)
был в исходном репозитории **`evav1111`**, но не переносился при миграциях
(`eveveveve` → `eevua`/`qwxqwxqw` → `cbejwb23`). Backend всё это время сохранял
код для его раздачи (`/api/web-ui`), но сами `web/` + `packages/` отсутствовали.

## Что сделано
1. Склонирован `github.com/svetlanaslinko057/evav1111`, скопированы:
   - `/app/web` (React SPA, 98 страниц)
   - `/app/packages` (`runtime-client` + `design-system` — symlink-зависимости)
2. Создан `/app/web/.env` с `REACT_APP_BACKEND_URL` (preview URL).
3. `yarn install` + `craco build` (`PUBLIC_URL=/api/web-ui`) → `/app/web/build`.
4. Backend раздаёт SPA на `/api/web-ui` (код уже присутствовал, `WEB_BUILD_DIR=/app/web/build`).

## Исправленный баг (блокировал весь сайт)
`tByEn is not defined` — рантайм-краш на лендинге. В ходе i18n-sweep в 6 секционных
компонентах (`SequenceSection`, `BuildModesSection`, `SystemSection`,
`CapabilitiesSection`, `UseCasesSection`, `PortfolioSection`) добавили вызовы
`tByEn(...)`, но не получили `tByEn` из `useLang()`. Исправлено в обоих вариантах
лендинга (`LandingPage.js` dark + `LandingPageLight.js`): добавлен хук, implicit-return
arrow-компоненты переведены в block-body с `return`.

## Доступ
- Веб-сайт: **https://mobile-app-expo-20.preview.emergentagent.com/api/web-ui**
- Админка: `/api/web-ui/admin/login` (Demo Admin Access / admin@atlas.dev)

## Как пересобрать web после правок
```
cd /app/web && PUBLIC_URL=/api/web-ui GENERATE_SOURCEMAP=false \
  NODE_OPTIONS=--max-old-space-size=3072 yarn build
```
Backend подхватывает новый build без рестарта.
