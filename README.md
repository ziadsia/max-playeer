# MAX — IPTV Web Player (Xtream Codes)

مشغّل ويب احترافي لخدمات IPTV عبر Xtream Codes API. السيرفر ثابت داخل الإعدادات (`XTREAM_HOST=http://max4k.xyz`) والعميل يدخل **Username + Password فقط**.

## كيف يعمل (ولماذا يوجد Backend؟)

```
المتصفح  ──►  Node (Express)  ──►  http://max4k.xyz
 React        /api  /play  /up      player_api.php + البث
```

السيرفر `http://` (بدون HTTPS) والمتصفح لا يسمح لموقع `https://` بتحميل بث `http://` (Mixed Content)، كما أن الاستجابات غالبًا بلا CORS. لذلك المشروع يتضمن Backend صغير يقوم بـ:

- التحقق من الحساب عبر `player_api.php` وإنشاء جلسة في **كوكي HttpOnly مشفّرة (AES-256-GCM)**؛ كلمة المرور لا تصل لكود المتصفح ولا تُخزَّن في localStorage.
- تمرير طلبات الـ API (قائمة بيضاء من الـ actions فقط) مع تخزين مؤقت 5 دقائق.
- تشغيل البث عبر `/play/live|movie|series/<id>.<ext>`، وإعادة كتابة روابط ملفات HLS (`.m3u8`) لتمر عبر نفس الدومين.
- تمرير الصور `http://` عبر رابط موقّع (لا يمكن استعماله كـ open proxy).

## التشغيل محليًا

المتطلبات: Node.js 18 أو أحدث.

```bash
npm install
cp .env.example .env        # على ويندوز: copy .env.example .env
npm run dev                 # الواجهة: http://localhost:5173
```

للتجربة بدون حساب حقيقي:

```bash
npm run mock                # سيرفر Xtream وهمي على المنفذ 9000 (test / test)
# في .env اجعل:  XTREAM_HOST=http://localhost:9000   ثم أعد تشغيل npm run dev
```

## اختبار تسجيل الدخول

1. تأكد أولًا أن السيرفر يرد من جهازك (استبدل USER و PASS):
   ```bash
   curl "http://max4k.xyz/player_api.php?username=USER&password=PASS"
   ```
   يجب أن ترى `"auth":1` و `"status":"Active"`.
2. افتح `http://localhost:5173` وأدخل نفس البيانات.
3. اختبار الـ Backend مباشرة:
   ```bash
   curl -i -c jar.txt -H "Content-Type: application/json" \
        -d '{"username":"USER","password":"PASS"}' http://localhost:3000/api/login
   curl -b jar.txt "http://localhost:3000/api/xc?action=get_live_categories"
   ```
4. بيانات خاطئة → رسالة "اسم المستخدم أو كلمة المرور غير صحيحة". السيرفر مطفأ/غير متاح → رسالة تعذر الاتصال.

## الرفع على الاستضافة

⚠️ الاستضافة المشتركة العادية (HTML/PHP فقط) **لا تكفي**، لأن المشروع يحتاج Node.js. الخيارات: VPS، أو استضافة تدعم Node.js (مثل cPanel → Setup Node.js App)، أو Docker.

**الطريقة العامة (VPS):**
```bash
npm install && npm run build          # ينتج مجلد dist
cp .env.example .env                  # عدّل SESSION_SECRET بقيمة عشوائية طويلة:  openssl rand -hex 32
NODE_ENV=production node server/index.js
# أو للتشغيل الدائم:  npm i -g pm2 && NODE_ENV=production pm2 start server/index.js --name max
```
يمكنك أيضًا بناء `dist` على جهازك ورفع `dist/` و`server/` و`package.json` و`.env` ثم تنفيذ `npm install --omit=dev` على الاستضافة.

**Docker:**
```bash
docker build -t max-player .
docker run -d -p 3000:3000 -e SESSION_SECRET=$(openssl rand -hex 32) -e COOKIE_SECURE=true max-player
```

**HTTPS (مهم في الإنتاج):** ضع Caddy أو Nginx أمام التطبيق. مثال Caddy:
```
max.example.com {
    reverse_proxy localhost:3000
}
```
(مع Nginx: أضف `proxy_buffering off;` و`proxy_read_timeout 3600s;` لتشغيل البث الطويل.) في الإنتاج فعّل `COOKIE_SECURE=true`.

## هيكل المشروع

```
server/index.js        Backend: الجلسة + Xtream proxy + بث + صور + استضافة dist
src/services/api.ts    كل طلبات الـ API في مكان واحد
src/hooks/             useAuth, useAsync, useLibrary (مفضلة/سجل/استكمال), usePlayer
src/components/        VideoPlayer (hls.js), Layout, MediaCard, ui
src/pages/             Login, Dashboard, Live, Movies, Series, Favorites, Recent, Search, Settings
src/i18n.tsx           عربي RTL + إنجليزي (جاهز، يُبدَّل من الإعدادات)
scripts/mock-xtream.mjs سيرفر تجريبي
```

المفضلة وسجل المشاهدة ونقطة استكمال الفيديو تُحفظ في localStorage لكل مستخدم (لا تحتوي أي بيانات سرية).

## ملاحظات وحدود

- **الصيغ:** البث المباشر يعمل عبر HLS (`m3u8`) — يجب أن يسمح الاشتراك بهذه الصيغة. صيغة `ts` الخام لا تشغّلها المتصفحات. الأفلام والحلقات تُشغَّل بامتدادها الأصلي؛ ملفات `mp4` (H.264) تعمل في كل المتصفحات، أما `mkv` أو الترميزات مثل HEVC فقد لا تعمل في بعض المتصفحات وهذا قيد من المتصفح.
- **حدود الاشتراك:** الاتصال بالسيرفر يخرج من IP الاستضافة (وليس جهاز العميل)، ويُحتسب على حد الاتصالات المتزامنة للحساب. وبعض المزوّدين يمنعون IPs مراكز البيانات؛ اختبر ذلك أولًا بأمر curl أعلاه من نفس السيرفر.
- القوائم الكبيرة (آلاف الأفلام) تُحمَّل مرة واحدة وتُخزَّن مؤقتًا، لذا أول فتح للوحة التحكم قد يأخذ بضع ثوانٍ.
