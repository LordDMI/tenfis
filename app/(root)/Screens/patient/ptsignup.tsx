import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, Image, Alert, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/utils/supabaseClient'
import { uploadProfilePicture } from '@/utils/uploadProfilePicture'
import { useRouter } from 'expo-router';

export default function PatientForm() {
    const [step, setStep] = useState(1)
    const router = useRouter()
    // الخطوة 1
    const [fullName, setFullName] = useState('')
    const [dob, setDob] = useState('')
    const [showPicker, setShowPicker] = useState(false)
    const [date, setDate] = useState(new Date())
    const [image, setImage] = useState<string | null>(null)
    const [Type, setType] = useState('')
    const [iname, setName] = useState('')

    // الخطوة 2
    const [placeOfBirth, setPlaceOfBirth] = useState('')
    const [currentAddress, setCurrentAddress] = useState('')

    // الخطوة 3
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [allergies, setAllergies] = useState('')
    // اختيار الدور (يمكنك تغييره لاحقًا حسب شاشتك)
    const [role] = useState<'patient' | 'psychologue'>('patient')

    const [loading, setLoading] = useState(false)

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowPicker(false)
        if (selectedDate) {
            setDate(selectedDate)
            const formatted = `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
            setDob(formatted)
        }
    }

    const validateStep = () => {
        if (step === 1 && !fullName) {
            Alert.alert('حقل مفقود', 'يرجى إدخال الاسم الكامل.')
            return false
        }
        if (step === 1 && !dob) {
            Alert.alert('حقل مفقود', 'يرجى تحديد تاريخ الميلاد.')
            return false
        }
        if (step === 2 && (!placeOfBirth || !currentAddress)) {
            Alert.alert('حقل مفقود', 'يرجى إكمال جميع الحقول.')
            return false
        }
        return true
    }

    const handleNext = () => {
        if (validateStep()) setStep((p) => p + 1)
    }
    const handleBack = () => setStep((p) => p - 1)

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const asset = result.assets?.[0];
            setImage(result.assets?.[0]?.uri);
            setType(asset.mimeType || 'image/jpeg'); // fallback
            setName(asset.uri.split('/').pop() || 'avatar.jpg');
            console.log("Selected image:", asset.uri, asset.mimeType);

        }
    };

    const handleSignUp = async () => {
        if (!phone || !email || !password) {
            Alert.alert('حقول مفقودة', 'يرجى ملء جميع الحقول المطلوبة.')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            Alert.alert('بريد إلكتروني غير صالح', 'يرجى إدخال بريد إلكتروني صحيح.')
            return
        }

        const passwordRegex = /^.{6,}$/
        if (!passwordRegex.test(password)) {
            Alert.alert('كلمة المرور ضعيفة', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.')
            return
        }

        const phoneRegex = /^[0-9]{8,15}$/
        if (!phoneRegex.test(phone)) {
            Alert.alert('رقم هاتف غير صالح', 'يرجى إدخال رقم هاتف صحيح.')
            return
        }

        setLoading(true)
        try {
            // 1) Create auth user with redirect for email confirmation
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: "exp://192.168.100.72:8081", // your Expo dev URL
                },
            })
            if (signUpErr || !signUpData.user) {
                throw new Error(signUpErr?.message || 'تعذر إنشاء المستخدم')
            }

            const userId = signUpData.user.id

            // 2) Upload image if any
            let avatarUrl: string | null = null
            if (image || Type || iname) {
                avatarUrl = await uploadProfilePicture( image,Type,iname ,userId )
                console.log("umagepicker",image);
                console.log("userid", userId);

            }

            // Convert date to ISO format
            const isoDate = date.toISOString().split('T')[0]

            // 3) Insert profile row
            const { error: profileErr } = await supabase.from('profiles').insert({
                id: userId,
                full_name: fullName,
                dob: isoDate,
                place_of_birth: placeOfBirth,
                phone,
                current_address: currentAddress,
                allergies,
                email,
                role,            // 'patient' | 'psychologue'
                avatar_url: avatarUrl,
            })

            if (profileErr) {
                throw new Error(profileErr.message)
            }

            Alert.alert(
                'تم بنجاح',
                'تم إنشاء حسابك وتخزين بياناتك بنجاح. يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.'
            )
            router.replace('/(root)/Screens/login')

        } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'حدث خطأ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1 p-5"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 }}
            >
                <Text className="text-2xl font-bold mb-5 text-center">تسجيل حساب</Text>

                {/* الخطوة 1: المعلومات الأساسية */}
                {step === 1 && (
                    <>
                        <Pressable onPress={pickImage} className="p-3 bg-blue-600 rounded-full active:opacity-70">
                            <Text className="text-white text-center">اختيار صورة شخصية</Text>
                        </Pressable>

                        {image && <Image source={{ uri: image }} className="w-32 h-32 rounded-full mt-4 self-center" />}

                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4"
                            placeholder="الاسم الكامل"
                            value={fullName}
                            onChangeText={setFullName}
                        />

                        <Pressable
                            className="border border-gray-300 bg-lime-200 rounded-lg p-3 mb-4 active:opacity-70"
                            onPress={() => setShowPicker(true)}
                        >
                            <Text className="text-center">{dob || 'اختر تاريخ الميلاد'}</Text>
                        </Pressable>

                        {showPicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}

                        <Pressable className="bg-blue-500 p-4 rounded-xl mt-4 active:opacity-70" onPress={handleNext}>
                            <Text className="text-white text-center text-lg font-semibold">التالي</Text>
                        </Pressable>
                    </>
                )}

                {/* الخطوة 2: العنوان */}
                {step === 2 && (
                    <>
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4"
                            placeholder="مكان الميلاد"
                            value={placeOfBirth}
                            onChangeText={setPlaceOfBirth}
                        />
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4"
                            placeholder="عنوان الإقامة الحالي"
                            value={currentAddress}
                            onChangeText={setCurrentAddress}
                        />
                        <View className="flex-row justify-between mt-4">
                            <Pressable className="bg-gray-400 p-4 rounded-xl flex-1 mr-2 active:opacity-70" onPress={handleBack}>
                                <Text className="text-white text-center text-lg font-semibold">السابق</Text>
                            </Pressable>
                            <Pressable className="bg-blue-500 p-4 rounded-xl flex-1 ml-2 active:opacity-70" onPress={handleNext}>
                                <Text className="text-white text-center text-lg font-semibold">التالي</Text>
                            </Pressable>
                        </View>
                    </>
                )}

                {/* الخطوة 3: التواصل وكلمة المرور */}
                {step === 3 && (
                    <>
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 text-right"
                            placeholder="رقم الهاتف"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4"
                            placeholder="البريد الإلكتروني"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 text-right"
                            placeholder="كلمة المرور"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-6 h-24"
                            placeholder="الحساسية أو الأمراض"
                            multiline
                            value={allergies}
                            onChangeText={setAllergies}
                        />

                        <View className="flex-row justify-between mt-4">
                            <Pressable className="bg-gray-400 p-4 rounded-xl flex-1 mr-2 active:opacity-70" onPress={handleBack}>
                                <Text className="text-white text-center text-lg font-semibold">السابق</Text>
                            </Pressable>
                            <Pressable
                                className="bg-green-500 p-4 rounded-xl flex-1 ml-2 active:opacity-70"
                                onPress={handleSignUp}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white text-center text-lg font-semibold">إرسال</Text>
                                )}
                            </Pressable>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}
