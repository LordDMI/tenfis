# دليل التحقق من الأخصائيين النفسيين

## الطريقة 1: استخدام لوحة التحكم (Admin Panel)

### الوصول إلى لوحة التحكم:
1. تأكد من أن حسابك لديه صلاحيات المدير
2. انتقل إلى: `/Screens/admin` في التطبيق
3. يمكنك رؤية جميع الأخصائيين والتحقق منهم

### إعداد حساب المدير:

#### الطريقة الأولى: إضافة email في الكود
عدّل ملف `app/(root)/Screens/admin.tsx` وأضف email حسابك في:
```typescript
const adminEmails = [
    'admin@tenfis.com',
    'your-email@example.com', // أضف email الخاص بك هنا
]
```

#### الطريقة الثانية: إضافة role في قاعدة البيانات
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## الطريقة 2: التحقق يدوياً من Supabase Dashboard

### خطوات التحقق:
1. افتح [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **Table Editor** → **profiles**
4. ابحث عن الأخصائي الذي تريد التحققه
5. انقر على الصف لتعديله
6. غيّر `is_verified` من `false` إلى `true`
7. احفظ التغييرات

### استخدام SQL Editor:
1. اذهب إلى **SQL Editor** في Supabase
2. استخدم أحد الأوامر التالية:

```sql
-- التحقق من أخصائي محدد بالـ ID
UPDATE profiles 
SET is_verified = true 
WHERE id = 'uuid-here' AND role = 'psychologue';

-- التحقق من أخصائي بالـ email
UPDATE profiles 
SET is_verified = true 
WHERE email = 'therapist@example.com' AND role = 'psychologue';
```

## الطريقة 3: إنشاء Trigger تلقائي (اختياري)

يمكنك إنشاء trigger يتحقق تلقائياً من الأخصائيين عند التسجيل:

```sql
-- Function to auto-verify therapists with valid license
CREATE OR REPLACE FUNCTION auto_verify_therapist()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-verify if license number exists and is not empty
    IF NEW.role = 'psychologue' AND NEW.license_number IS NOT NULL AND LENGTH(TRIM(NEW.license_number)) > 0 THEN
        NEW.is_verified = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER verify_therapist_on_insert
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_verify_therapist();
```

## معايير التحقق

يُنصح بالتحقق من:
- ✅ وجود رقم رخصة صحيح
- ✅ سنوات الخبرة كافية
- ✅ التخصصات محددة
- ✅ معلومات الملف الشخصي مكتملة
- ✅ التحقق من صحة الوثائق (يدوياً)

## ملاحظات مهمة

1. **الأمان**: تأكد من حماية صفحة Admin بصلاحيات مناسبة
2. **المراجعة**: راجع معلومات الأخصائي قبل التحقق منه
3. **السجلات**: يمكنك إضافة جدول `verification_logs` لتسجيل من قام بالتحقق ومتى

## إضافة جدول سجلات التحقق (اختياري)

```sql
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action TEXT NOT NULL CHECK (action IN ('verified', 'unverified')),
    notes TEXT
);

-- Add RLS
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view verification logs" ON verification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.email LIKE '%admin%')
        )
    );
```

