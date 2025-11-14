# كيفية إنشاء حساب المدير

## الطريقة 1: إنشاء حساب جديد من التطبيق (الأسهل)

1. **سجّل حساب جديد** في التطبيق باستخدام email: `admin@tenfis.com`
2. **اختر "أنا مستخدم"** (patient) عند التسجيل (لأن admin ليس خياراً في التسجيل)
3. **بعد التسجيل**، اذهب إلى Supabase Dashboard
4. **افتح SQL Editor** واشغل هذا الأمر:

```sql
-- استبدل 'USER_UUID' بـ UUID المستخدم من Authentication > Users
UPDATE profiles 
SET role = 'admin', is_verified = true
WHERE email = 'admin@tenfis.com';
```

## الطريقة 2: إنشاء حساب مباشرة من Supabase Dashboard

### الخطوة 1: إنشاء المستخدم في Authentication
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **Authentication** → **Users**
4. انقر على **Add User** أو **Invite User**
5. أدخل:
   - **Email**: `admin@tenfis.com`
   - **Password**: (اختر كلمة مرور قوية)
   - **Auto Confirm User**: ✅ (مفعل)
6. انقر **Create User**
7. **انسخ UUID** الخاص بالمستخدم (ستحتاجه في الخطوة التالية)

### الخطوة 2: إنشاء Profile مع role = 'admin'
1. اذهب إلى **SQL Editor**
2. شغّل هذا الأمر (استبدل `USER_UUID` بـ UUID الذي نسخته):

```sql
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_verified
) VALUES (
    'USER_UUID',  -- استبدل بـ UUID الفعلي
    'admin@tenfis.com',
    'مدير النظام',
    'admin',
    true
);
```

## الطريقة 3: تحويل مستخدم موجود إلى admin

إذا كان لديك حساب موجود بالفعل:

```sql
-- تحويل مستخدم موجود إلى admin
UPDATE profiles 
SET role = 'admin', is_verified = true
WHERE email = 'your-email@example.com';
```

## التحقق من أن الحساب يعمل

بعد إنشاء الحساب:
1. سجّل دخول في التطبيق باستخدام `admin@tenfis.com`
2. انتقل إلى: `/(root)/Screens/admin`
3. يجب أن ترى لوحة التحكم

## ملاحظات

- تأكد من أن جدول `profiles` يحتوي على عمود `role`
- يمكن أن يكون `role` = 'admin', 'patient', أو 'psychologue'
- بعد تحويل المستخدم إلى admin، سجّل خروج ثم دخول مرة أخرى

## إضافة المزيد من المديرين

```sql
-- إضافة مدير آخر
UPDATE profiles 
SET role = 'admin'
WHERE email = 'another-admin@example.com';
```

