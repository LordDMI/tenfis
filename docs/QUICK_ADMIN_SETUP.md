# إعداد حساب المدير بسرعة

## المشكلة
عند محاولة تسجيل الدخول بـ `admin@tenfis.com` تظهر رسالة "invalid login credential" لأن الحساب غير موجود.

## الحل السريع (3 خطوات)

### الخطوة 1: تحديث قاعدة البيانات
افتح **Supabase SQL Editor** واشغل:

```sql
-- تحديث constraint للسماح بـ 'admin' كـ role
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('patient', 'psychologue', 'admin'));
```

### الخطوة 2: إنشاء المستخدم في Authentication
1. اذهب إلى **Supabase Dashboard** → **Authentication** → **Users**
2. انقر **Add User** أو **Invite User**
3. أدخل:
   - **Email**: `admin@tenfis.com`
   - **Password**: اختر كلمة مرور قوية (مثلاً: `Admin123!@#`)
   - ✅ **Auto Confirm User**: مفعل
4. انقر **Create User**
5. **انسخ UUID** الخاص بالمستخدم (ستجده في قائمة المستخدمين)

### الخطوة 3: إنشاء Profile للمدير
في **SQL Editor**، شغّل (استبدل `USER_UUID_HERE` بـ UUID من الخطوة 2):

```sql
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_verified,
    created_at
) VALUES (
    'USER_UUID_HERE',  -- استبدل بـ UUID من Authentication
    'admin@tenfis.com',
    'مدير النظام',
    'admin',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
    role = 'admin',
    is_verified = true;
```

### الخطوة 4: تسجيل الدخول
الآن يمكنك تسجيل الدخول:
- **Email**: `admin@tenfis.com`
- **Password**: (كلمة المرور التي اخترتها في الخطوة 2)

## طريقة بديلة: استخدام حساب موجود

إذا كان لديك حساب موجود بالفعل:

1. سجّل دخول بحسابك الحالي
2. في **SQL Editor**، شغّل:

```sql
UPDATE profiles 
SET role = 'admin', is_verified = true
WHERE email = 'your-email@example.com';
```

3. سجّل خروج ثم دخول مرة أخرى

## التحقق

بعد تسجيل الدخول، انتقل إلى:
- `/(root)/Screens/admin` في التطبيق
- يجب أن ترى لوحة التحكم

## ملاحظات

- تأكد من تشغيل SQL في الخطوة 1 أولاً (لتحديث constraint)
- UUID موجود في **Authentication > Users** بعد إنشاء المستخدم
- يمكنك إضافة المزيد من المديرين بنفس الطريقة

