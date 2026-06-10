# Деплой TestAP (Supabase + Render + Vercel)

Покрокова інструкція. Технічні файли в репозиторії вже підготовлені:
- `render.yaml` — backend на Render
- `frontend/vercel.json` — SPA-маршрутизація на Vercel
- `backend/Dockerfile` — опційно (Docker-хостинг)

---

## Що ви отримаєте

| Компонент | Сервіс | URL (приклад) |
|-----------|--------|----------------|
| База даних | Supabase | (внутрішній) |
| Backend API | Render | `https://testap-api.onrender.com` |
| Frontend | Vercel | `https://testap.vercel.app` |

**QR-код на захист:** URL з Vercel + GitHub + відео на Drive/YouTube.

---

## Крок 0 — Передумови (ви робите)

1. Акаунт [GitHub](https://github.com) — код уже в [TestAP_](https://github.com/Olegkrkl/TestAP_)
2. Акаунт [Supabase](https://supabase.com) — проєкт **активний** (не paused)
3. Акаунт [Render](https://render.com) — безкоштовний tier
4. Акаунт [Vercel](https://vercel.com) — безкоштовний tier

Запуште останні зміни з деплой-файлами на GitHub (якщо ще не запушено):

```powershell
cd d:\tst-ap
git add .
git commit -m "Add deployment config for Render and Vercel"
git push origin main
```

---

## Крок 1 — Supabase (база даних)

1. Відкрийте [Supabase Dashboard](https://supabase.com/dashboard) → ваш проєкт
2. Якщо проєкт **Paused** — натисніть **Restore project**
3. **Project Settings → Database → Connection string → URI**
4. Скопіюйте рядок і **замініть** на формат для FastAPI:

```
postgresql+asyncpg://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Важливо:**
- Префікс має бути `postgresql+asyncpg://` (не просто `postgresql://`)
- Для Render часто краще **Session pooler** (порт **6543**), не Direct connection
- Пароль — з Settings → Database → Database password

Збережіть `DATABASE_URL` — знадобиться на Render.

---

## Крок 2 — Backend на Render (ви робите)

### 2.1 Створити Web Service

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. Підключіть GitHub репозиторій `Olegkrkl/TestAP_`
3. Налаштування:

| Поле | Значення |
|------|----------|
| **Name** | `testap-api` |
| **Region** | Frankfurt (EU) або найближчий |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Pre-Deploy Command** | `alembic upgrade head` |

4. Plan: **Free** (для диплому достатньо; сервіс «засинає» після 15 хв простою — перше відкриття ~30 сек)

### 2.2 Environment Variables (Render → Environment)

| Key | Value |
|-----|-------|
| `DATABASE_URL` | ваш Supabase URL (`postgresql+asyncpg://...`) |
| `JWT_SECRET` | довгий випадковий рядок (Generate або свій, 32+ символів) |
| `FRONTEND_URL` | поки залиште `http://localhost:5173` — оновите після Vercel |
| `REQUIRE_EMAIL_VERIFICATION` | `false` |
| `GOOGLE_CLIENT_ID` | (опційно) або порожньо |
| `RESEND_API_KEY` | (опційно) або порожньо |

5. **Create Web Service** → дочекайтесь деплою (5–10 хв)

### 2.3 Перевірка backend

Відкрийте в браузері:

```
https://ВАШ-SERVICE.onrender.com/health
```

Має бути: `{"status":"ok"}`

API docs: `https://ВАШ-SERVICE.onrender.com/docs`

**Запишіть URL backend**, наприклад: `https://testap-api.onrender.com`

---

## Крок 3 — Frontend на Vercel (ви робите)

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository → `TestAP_`
2. Налаштування проєкту:

| Поле | Значення |
|------|----------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` (Edit → вкажіть папку `frontend`) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

3. **Environment Variables:**

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://ВАШ-SERVICE.onrender.com/api/v1` |

(замініть на ваш Render URL + `/api/v1`)

4. **Deploy**

5. Після деплою скопіюйте URL, наприклад: `https://testap.vercel.app`

### 3.1 Оновити CORS на Render

Поверніться в Render → **Environment** → змініть:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://testap.vercel.app` (ваш Vercel URL, **без** слеша в кінці) |

Render перезапустить сервіс автоматично.

---

## Крок 4 — Створити користувача для демо (ви робите)

Локально на комп’ютері (з production DATABASE_URL):

```powershell
cd d:\tst-ap\backend
.\venv\Scripts\activate
$env:DATABASE_URL = "postgresql+asyncpg://..."   # ваш Supabase URL
python -m app.scripts.create_admin --email demo@testap.app --name "Demo Student" --password "Demo1234!" --role student
```

Або викладача:

```powershell
python -m app.scripts.create_admin --email teacher@testap.app --name "Demo Teacher" --password "Demo1234!" --role teacher
```

---

## Крок 5 — Перевірка повного циклу

1. Відкрийте Vercel URL
2. Увійдіть (demo@testap.app / Demo1234!)
3. Створіть або пройдіть тренувальний тест
4. Переконайтесь, що немає помилок Network / 401

**Якщо 401 на login:** перевірте `VITE_API_BASE_URL` (має бути з `/api/v1` в кінці).

**Якщо CORS error:** перевірте `FRONTEND_URL` на Render = точний Vercel URL.

**Якщо 500 на login:** Supabase проєкт paused або неправильний `DATABASE_URL`.

---

## Крок 6 — QR-коди для презентації (ви робите)

Згенеруйте на [qr-code-generator.com](https://www.qr-code-generator.com/) або в Canva:

| QR | URL |
|----|-----|
| Продукт | `https://testap.vercel.app` |
| GitHub | `https://github.com/Olegkrkl/TestAP_` |
| Відео | посилання на YouTube / Google Drive |

---

## Google OAuth (опційно)

Якщо потрібен вхід через Google:

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID (Web)
2. **Authorized JavaScript origins:** `https://testap.vercel.app`
3. **Authorized redirect URIs:** не обов’язково для GIS button flow
4. Скопіюйте Client ID → Render env `GOOGLE_CLIENT_ID`

---

## Обмеження free tier

| Сервіс | Обмеження |
|--------|-----------|
| **Render Free** | Sleep після 15 хв; cold start ~30–60 сек |
| **Supabase Free** | Pause після 1 тижня неактивності |
| **Vercel Free** | Достатньо для диплому |

**Перед захистом:** за 10 хв відкрийте сайт, щоб Render «прокинувся»; перевірте Supabase active.

---

## Альтернатива: Blueprint Render

Можна імпортувати `render.yaml` з кореня репо:

Render → **New +** → **Blueprint** → підключити репо → задати секрети вручну.

---

## Допомога

Якщо деплой падає — надішліть скрін **Render Logs** (Build / Deploy) і текст помилки.
