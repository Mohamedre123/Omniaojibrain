# 🚀 دليل نشر Oji Brain

## ⚠️ مهمّ جداً: متغيّرات البيئة (Environment Variables)

**أيّاً كانت الاستضافة** التي تختارها، يجب إضافة هذه المتغيّرات قبل البناء:

| المتغيّر | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام لـ Supabase |
| `GEMINI_API_KEY` | مفتاح Google AI Studio |
| `NEXT_PUBLIC_SITE_URL` | رابط الموقع النهائي |

> **سبب فشل Netlify الأكثر شيوعاً**: نسيانُ إضافة هذه المتغيّرات في لوحة Netlify.

---

## ✅ النشر على Netlify (خطوة بخطوة)

### الطريقة الأولى: من واجهة Netlify مباشرة (الأسهل)

1. **ارفع المشروع على GitHub** (إن لم تكن قد رفعته):
   ```bash
   git init
   git add .
   git commit -m "Oji Brain MVP"
   ```
   ثم أنشئ Repository جديداً على GitHub وارفع عليه.

2. **اذهب إلى [netlify.com](https://netlify.com)** → **Add new site** → **Import from GitHub** → اختر الـ Repository.

3. **إعدادات البناء** (Netlify ستكتشفها تلقائياً من `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `22`

4. **⚠️ أهمّ خطوة — أضف متغيّرات البيئة قبل النشر**:
   اضغط **Show advanced** → **New variable** وأضف كلّ متغيّر من الجدول أعلاه.

5. اضغط **Deploy** ✅

### بعد النشر — إعدادات إضافية مهمّة

1. خذ رابط Netlify (مثلاً `https://oji-brain.netlify.app`)
2. اذهب إلى Supabase Dashboard → **Authentication** → **URL Configuration**:
   - **Site URL**: ضع رابط Netlify
   - **Redirect URLs**: أضف `https://oji-brain.netlify.app/auth/callback`
3. ارجع إلى Netlify → Environment Variables → عدّل `NEXT_PUBLIC_SITE_URL` ليكون رابط Netlify
4. اضغط **Redeploy** (Trigger deploy → Deploy site)

---

## ✅ النشر على Vercel (الأبسط)

1. ادفع المشروع لـ GitHub
2. [vercel.com](https://vercel.com) → **New Project** → اختر الـ Repo
3. أضف **Environment Variables** (الأربعة المذكورة فوق)
4. اضغط **Deploy** ✅

Vercel تكتشف Next.js تلقائياً دون أيّ إعداد إضافي.

---

## ✅ النشر على Cloudflare Pages

1. ادفع المشروع لـ GitHub
2. Cloudflare → Pages → **Create application** → Connect to Git
3. **Framework preset**: Next.js
4. **Build command**: `npm run build`
5. **Build output**: `.next`
6. أضف Environment Variables
7. اضغط Deploy ✅

---

## ✅ النشر عبر Docker (أيّ VPS)

### بناء الصورة
```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx \
  -t oji-brain:latest .
```

### التشغيل
```bash
docker run -d \
  --name oji-brain \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx \
  -e GEMINI_API_KEY=AIzaSyXxx \
  -e NEXT_PUBLIC_SITE_URL=https://yourdomain.com \
  --restart unless-stopped \
  oji-brain:latest
```

### مع Nginx + HTTPS (Let's Encrypt)
```nginx
server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## 📊 مقارنة الاستضافات

| الاستضافة | الصعوبة | السعر | السرعة |
|---|---|---|---|
| **Vercel** | ⭐ سهل جداً | مجاني (Hobby) | ⚡⚡⚡ |
| **Netlify** | ⭐ سهل | مجاني (Starter) | ⚡⚡⚡ |
| **Cloudflare Pages** | ⭐⭐ متوسط | مجاني | ⚡⚡⚡ |
| **Railway** | ⭐ سهل | $5/شهر | ⚡⚡ |
| **Hetzner VPS** + Docker | ⭐⭐⭐ | €4/شهر | ⚡⚡⚡ |
| **DigitalOcean App** | ⭐⭐ | $5/شهر | ⚡⚡ |

---

## 🔐 اختبار الأمان بعد النشر

افتح [securityheaders.com](https://securityheaders.com) واختبر الدومين. يجب الحصول على **A** أو **A+**.

تحقّق من:
- ✅ HTTPS يعمل (`https://yourdomain.com` بدون تحذير)
- ✅ HTTP → HTTPS redirect تلقائي
- ✅ Supabase RLS مفعّل (افتح حسابين مختلفين وتأكّد أنّ كلّ مستخدم لا يرى بيانات الآخر)
- ✅ المفاتيح السرّية في الـ Environment Variables فقط، **ليست في الـ Git**

---

## 🆘 أكثر مشاكل النشر شيوعاً

### 1. "Build failed" على Netlify/Vercel
**السبب الأكثر شيوعاً**: نسيان إضافة Environment Variables.
**الحل**: راجع متغيّرات البيئة في لوحة الاستضافة.

### 2. "useSearchParams should be wrapped in Suspense"
**السبب**: مشكلةٌ في Next.js 15 (تمّ حلّها بالفعل في هذا المشروع).

### 3. الموقع يظهر لكن لا أستطيع تسجيل الدخول
**السبب**: Site URL في Supabase لا يطابق رابط الاستضافة.
**الحل**: اذهب إلى Supabase → Authentication → URL Configuration وحدّث الروابط.

### 4. الذكاء الاصطناعي لا يجيب
**السبب**: مفتاح Gemini غير موجود أو خاطئ.
**الحل**: تأكّد أنّ `GEMINI_API_KEY` يبدأ بـ `AIzaSy...` ومضافٌ في Environment Variables.

### 5. الصور لا تُحفظ
**السبب**: لم يتمّ تشغيل `supabase/schema.sql`.
**الحل**: راجع الخطوة في README الرئيسي.

### 6. Supabase Free Tier توقّف
**السبب**: Supabase توقف المشاريع المجانية بعد أسبوع من عدم الاستخدام.
**الحل**: ادخل إلى Supabase Dashboard واضغط "Restore project".
