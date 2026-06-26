# تحسين نظام البطل الحديدي — خطة التنفيذ
# Iron Champion 2026 — Implementation Plan

تنفيذ 12 تحسين معماري شامل على النظام الحالي.

---

## User Review Required

> [!IMPORTANT]
> هذه التغييرات ستعيد هيكلة المشروع بالكامل. الكود الحالي سيبقى يعمل بنفس الطريقة لكن بمعمارية أفضل. **لن يتغير شكل التطبيق** إلا بإضافة: Toast notifications، ConfirmDialog مخصص، Loading states، وتجاوب الهاتف.

> [!WARNING]
> **Supabase Realtime** يتطلب تفعيل Realtime على الجداول من Supabase Dashboard:
> `Database → Replication → Enable` على كل الجداول (teams, players, checkins, timing, incidents, substitutions, settings).
> إذا لم يكن مفعّلاً، النظام سيعمل بـ fallback polling كما هو حالياً.

---

## Proposed Changes

### Phase 1: Shared Utilities

#### [NEW] [timeHelpers.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/utils/timeHelpers.js)
- دالة `secondsToTimeString(sec)` — موحّدة من 4 ملفات
- دالة `timeStringToSeconds(val)` — منقولة من Timing.jsx
- دالة `formatClock(date)` — تنسيق الساعة

#### [NEW] [validation.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/utils/validation.js)
- `validateTeam(data, existingTeams)` — التحقق من بيانات الفريق (اسم فريد، رمز صحيح)
- `validatePlayer(data, settings, existingPlayers)` — التحقق من بيانات اللاعب
- `validateTiming(rawTimes)` — التحقق من صحة الأوقات (غير سالبة)
- `validateIncident(data)` — التحقق من بيانات الحادثة
- كل دالة ترجع `{ valid: boolean, errors: string[] }`

---

### Phase 2: Split state.js into Modules

#### [NEW] [supabaseClient.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/lib/supabaseClient.js)
- تهيئة Supabase client فقط
- دالة مساعدة `handleSupabaseError(result, operation)` لفحص الأخطاء

#### [NEW] [cache.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/store/cache.js)
- الكاش المحلي `cache` object
- `DEFAULT_SETTINGS` ثوابت
- `fetchAllFromSupabase()` مع error handling
- `setupRealtimeSubscriptions()` — اشتراكات Supabase Realtime كبديل للـ polling
- دالة `initDatabase()` — تبدأ بـ fetch أولي ثم realtime (مع fallback لـ polling إذا فشل)
- `resetDatabase()`, `exportDatabaseState()`, `importDatabaseState()`

#### [NEW] [teamStore.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/store/teamStore.js)
- `getTeams()`, `upsertTeam()`, `deleteTeam()` — مع error handling

#### [NEW] [playerStore.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/store/playerStore.js)
- `getPlayers()`, `getPlayersByTeam()`, `upsertPlayer()`, `deletePlayer()`, `getPlayerBySlotKey()`

#### [NEW] [timingStore.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/store/timingStore.js)
- `getTimingEntries()`, `getTimingEntryByTeam()`, `upsertTimingEntry()`, `deleteTimingEntry()`

#### [NEW] [checkinStore.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/store/checkinStore.js)
- `getCheckIns()`, `upsertCheckIn()`, `deleteCheckIn()`, `getUncheckedPlayers()`

#### [NEW] [incidentStore.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/store/incidentStore.js)
- `getIncidents()`, `upsertIncident()`, `deleteIncident()`

#### [NEW] [substitutionStore.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/store/substitutionStore.js)
- `getSubstitutions()`, `upsertSubstitution()`, `executeSubstitution()`, `revertSubstitution()`

#### [NEW] [calculations.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/store/calculations.js)
- `getTeamResultsCalculated()`, `getLiveLeaderboard()`, `getOverallPlayerRanking()`, `getNotificationLog()`

#### [MODIFY] [state.js](file:///c:/Users/Ahmed/Desktop/iron_men/src/state.js)
- يصبح ملف **re-export** فقط — يعيد تصدير كل شيء من الـ modules الجديدة
- هذا يضمن أن كل الـ imports الحالية في الصفحات تعمل بدون تعديل مبدئي

---

### Phase 3: React Context + Toast + ConfirmDialog + Loading

#### [NEW] [AppContext.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/context/AppContext.jsx)
- `AppProvider` component يلف التطبيق
- يحتوي على: `language`, `setLanguage`, `role`, `setRole`, `t()` translation helper
- `syncTick` state — يتحدث عند أي تغيير في البيانات
- `toast(message, type)` — إظهار Toast notifications
- `confirm(message, onConfirm)` — إظهار ConfirmDialog
- `isLoading` — حالة التحميل الأولي
- `isOnline` — حالة الاتصال بـ Supabase

#### [NEW] [Toast.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/components/Toast.jsx)
- مكوّن Toast عالمي يظهر في أسفل يمين الشاشة
- أنواع: `success` (أخضر), `error` (أحمر), `warning` (أصفر), `info` (أزرق)
- أنيميشن slide-in / slide-out
- يختفي تلقائياً بعد 4 ثوانٍ مع شريط تقدم
- يدعم عرض أكثر من Toast في نفس الوقت (stack)

#### [NEW] [ConfirmDialog.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/components/ConfirmDialog.jsx)
- مربع حوار مخصص بدل `window.confirm()`
- backdrop ضبابي مع أنيميشن
- أزرار تأكيد/إلغاء بتصميم متوافق مع النظام
- يقبل: `title`, `message`, `confirmText`, `cancelText`, `variant` (danger/warning/info)

#### [NEW] [LoadingScreen.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/components/LoadingScreen.jsx)
- شاشة تحميل أولية مع شعار البطولة وأنيميشن
- Skeleton components للجداول والبطاقات
- مؤشر حالة الاتصال في الـ Navbar (نقطة خضراء/حمراء)

---

### Phase 4: React Router

#### [MODIFY] [main.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/main.jsx)
- إضافة `BrowserRouter` wrapper

#### [MODIFY] [App.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/App.jsx)
- استبدال `useState('tab')` و `switch/case` بـ React Router `<Routes>`
- الـ Sidebar links تصبح `<NavLink>` بدل `onClick`
- كل الـ state المشتركة (language, role, sync) تنتقل إلى `AppContext`
- Routes المقترحة:
  ```
  /                  → Dashboard
  /results           → Results
  /leaderboard       → Leaderboard
  /player-ranking    → PlayerRanking
  /checkin           → CheckIn
  /timing            → Timing
  /teams             → Teams
  /players           → Players
  /incidents         → Incidents
  /substitutions     → Substitutions
  /notifications     → Notifications
  /settings          → Settings
  ```

---

### Phase 5: Update All Pages

كل صفحة ستتحدث لتستخدم:
- `useAppContext()` بدل props (`t`, `role`, `syncTick`)
- `toast()` بدل `setMsg()` + `setTimeout`
- `confirm()` بدل `window.confirm()`
- `import { secondsToTimeString } from '../utils/timeHelpers'` بدل النسخة المحلية
- Validation functions قبل الحفظ
- Error handling صحيح مع عرض أخطاء Supabase

#### [MODIFY] Pages المتأثرة:
- [Dashboard.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Dashboard.jsx) — context + `useNavigate()` بدل `setTab`
- [Teams.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Teams.jsx) — context + toast + confirm + validation
- [Players.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Players.jsx) — context + toast + confirm + validation
- [CheckIn.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/CheckIn.jsx) — context + toast + confirm
- [Timing.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Timing.jsx) — context + toast + confirm + shared timeHelpers + dynamic judges
- [Results.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Results.jsx) — context + shared timeHelpers
- [Leaderboard.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Leaderboard.jsx) — context + shared timeHelpers
- [PlayerRanking.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/PlayerRanking.jsx) — context + shared timeHelpers
- [Incidents.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Incidents.jsx) — context + toast + confirm + validation
- [Substitutions.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Substitutions.jsx) — context + toast + confirm
- [Notifications.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Notifications.jsx) — context
- [Settings.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Settings.jsx) — context + toast + confirm + dynamic judges field

---

### Phase 6: Dynamic Judges

#### [MODIFY] [Settings.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Settings.jsx)
- إضافة حقل لإدارة قائمة الحكام (إضافة/حذف أسماء)
- تخزينها في `settings.judges` كـ JSON array في Supabase

#### [MODIFY] [Timing.jsx](file:///c:/Users/Ahmed/Desktop/iron_men/src/pages/Timing.jsx)
- قراءة قائمة الحكام من `getSettings().judges` بدل الـ hardcoded options
- fallback للقائمة الحالية إذا لم تكن موجودة

---

### Phase 7: Responsive Design

#### [MODIFY] [index.css](file:///c:/Users/Ahmed/Desktop/iron_men/src/index.css)
إضافة Media Queries شاملة:

**Tablet (≤1024px):**
- Sidebar تصغر لـ icons فقط (60px)
- `.grid-2` يصبح عمود واحد
- تصغير خط الـ Navbar

**Mobile (≤768px):**
- Sidebar تختفي وتصبح Bottom Navigation Bar ثابت
- Navbar يتكثف (شعار + أيقونات فقط)
- `.stats-grid` يصبح 2 أعمدة
- الجداول تصبح scrollable أفقياً
- Form grids تصبح عمود واحد
- أزرار تبديل الدور تنتقل لقائمة منسدلة

**Mobile Small (≤480px):**
- Bottom nav بأيقونات أصغر
- Stats cards عمود واحد
- خط أصغر عام

**Projector Mode:**
- إضافة media query لـ `min-width: 1920px` لتحسين عرض البروجكتور

---

## Verification Plan

### Automated Tests
```bash
npm run build
```
- التأكد من أن البناء ينجح بدون أخطاء

### Manual Verification
- فتح كل صفحة والتأكد من عملها
- تجربة CRUD على: فرق، لاعبين، توقيت، حوادث، تبديلات
- تجربة Toast notifications (نجاح + خطأ)
- تجربة ConfirmDialog على الحذف
- تجربة الروابط المباشرة (مثل `/timing`)
- تجربة زر الرجوع في المتصفح
- تصغير المتصفح لعرض الهاتف والتأكد من التجاوب
- التأكد من عمل Realtime (فتح تبويبين ومراقبة التزامن)
