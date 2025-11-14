import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, Image, Alert, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/utils/supabaseClient'
import { uploadProfilePicture } from '@/utils/uploadProfilePicture'
import { uploadCertificate } from '@/utils/uploadCertificate'
import { useRouter } from 'expo-router'

const SPECIALTIES = [
    'مختص في المعرفي السلوكي',
    'مختص في العلاج الأسري',
    'مختص في العلاج الانساني',
    'مختص في الطفل والمراهق',
    'مختص في السيكوموتريسيتي',
    'مختص في علاج الاضطرابات السيكوسوماتية',
    'مختص في علاج الصدمة النفسية',
    'طبيب مختص في الأعشاب',
    'طبيب متنقل',
    'معالج التأهيل الوظيفي',
    'ممرض'
]

export default function PsychologueSignup() {
    const [step, setStep] = useState(1)
    const router = useRouter()
    
    // Step 1: Basic Info
    const [fullName, setFullName] = useState('')
    const [dob, setDob] = useState('')
    const [showPicker, setShowPicker] = useState(false)
    const [date, setDate] = useState(new Date())
    const [image, setImage] = useState<string | null>(null)
    const [Type, setType] = useState('')
    const [iname, setName] = useState('')
    const [certificate, setCertificate] = useState<string | null>(null)
    const [certificateType, setCertificateType] = useState('')
    const [certificateName, setCertificateName] = useState('')

    // Step 2: Professional Info
    const [specialties, setSpecialties] = useState<string[]>([])
    const [bio, setBio] = useState('')
    const [rate, setRate] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Step 3: Address & Verification
    const [placeOfBirth, setPlaceOfBirth] = useState('')
    const [currentAddress, setCurrentAddress] = useState('')
    const [licenseNumber, setLicenseNumber] = useState('')
    const [yearsOfExperience, setYearsOfExperience] = useState('')
    
    const pickCertificate = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 1,
            })

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0]
                if (asset.uri) {
                    setCertificate(asset.uri)
                    setCertificateType(asset.mimeType || 'image/jpeg')
                    setCertificateName(asset.uri.split('/').pop() || 'certificate.jpg')
                } else {
                    Alert.alert('خطأ', 'فشل اختيار الملف. يرجى المحاولة مرة أخرى.')
                }
            }
        } catch (error: any) {
            console.error('Error picking certificate:', error)
            Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الملف. يرجى المحاولة مرة أخرى.')
        }
    }

    const [loading, setLoading] = useState(false)
    const role = 'psychologue' as const

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowPicker(false)
        if (selectedDate) {
            setDate(selectedDate)
            const formatted = `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
            setDob(formatted)
        }
    }

    const toggleSpecialty = (specialty: string) => {
        setSpecialties(prev => 
            prev.includes(specialty) 
                ? prev.filter(s => s !== specialty)
                : [...prev, specialty]
        )
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
        if (step === 2 && (!bio || !rate || !phone || !email || !password || specialties.length === 0)) {
            Alert.alert('حقل مفقود', 'يرجى إكمال جميع الحقول.')
            return false
        }
        if (step === 3 && (!placeOfBirth || !currentAddress || !licenseNumber || !yearsOfExperience || !certificate)) {
            Alert.alert('حقل مفقود', 'يرجى إكمال جميع الحقول بما في ذلك رفع الشهادة.')
            return false
        }
        return true
    }

    const handleNext = () => {
        if (validateStep()) setStep((p) => p + 1)
    }
    const handleBack = () => setStep((p) => p - 1)

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            })

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0]
                if (asset.uri) {
                    setImage(asset.uri)
                    setType(asset.mimeType || 'image/jpeg')
                    setName(asset.uri.split('/').pop() || 'avatar.jpg')
                } else {
                    Alert.alert('خطأ', 'فشل اختيار الصورة. يرجى المحاولة مرة أخرى.')
                }
            }
        } catch (error: any) {
            console.error('Error picking image:', error)
            Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة. يرجى المحاولة مرة أخرى.')
        }
    }

    const handleSignUp = async () => {
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

        const rateNum = parseFloat(rate)
        if (isNaN(rateNum) || rateNum <= 0) {
            Alert.alert('سعر غير صالح', 'يرجى إدخال سعر صحيح.')
            return
        }

        setLoading(true)
        try {
            // 1) Create auth user
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: "exp://192.168.100.72:8081",
                },
            })
            if (signUpErr || !signUpData.user) {
                throw new Error(signUpErr?.message || 'تعذر إنشاء المستخدم')
            }

            const userId = signUpData.user.id

            // 2) Upload image if any
            let avatarUrl: string | null = null
            if (image && Type && iname) {
                avatarUrl = await uploadProfilePicture(image, Type, iname, userId)
            }

            // 3) Upload certificate
            let certificateUrl: string | null = null
            if (certificate && certificateType && certificateName) {
                console.log('Attempting to upload certificate...')
                console.log('Certificate URI:', certificate)
                console.log('Certificate type:', certificateType)
                console.log('Certificate name:', certificateName)
                
                certificateUrl = await uploadCertificate(certificate, certificateType, certificateName, userId)
                
                if (!certificateUrl) {
                    console.error('Certificate upload returned null')
                    throw new Error('فشل رفع الشهادة. تأكد من أن الملف صحيح وأن لديك اتصال بالإنترنت وحاول مرة أخرى.')
                }
                console.log('Certificate uploaded successfully:', certificateUrl)
            } else {
                throw new Error('يرجى اختيار ملف شهادة صحيح.')
            }

            // Convert date to ISO format
            const isoDate = date.toISOString().split('T')[0]

            // 4) Insert profile row
            const { error: profileErr } = await supabase.from('profiles').insert({
                id: userId,
                full_name: fullName,
                dob: isoDate,
                place_of_birth: placeOfBirth,
                phone,
                current_address: currentAddress,
                email,
                role,
                avatar_url: avatarUrl,
                specialties: specialties,
                bio: bio,
                rate: rateNum,
                is_verified: false, // Admin will verify later
                license_number: licenseNumber,
                years_of_experience: parseInt(yearsOfExperience) || 0,
                certificate_url: certificateUrl,
            })

            if (profileErr) {
                throw new Error(profileErr.message)
            }

            Alert.alert(
                'تم بنجاح',
                'تم إنشاء حسابك بنجاح. سيتم مراجعة طلبك والتحقق من معلوماتك قريباً.'
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
                <Text className="text-2xl font-bold mb-5 text-center">تسجيل حساب أخصائي نفسي</Text>

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <>
                        <Pressable onPress={pickImage} className="p-3 bg-blue-600 rounded-full active:opacity-70 mb-4">
                            <Text className="text-white text-center">اختيار صورة شخصية</Text>
                        </Pressable>

                        {image && <Image source={{ uri: image }} className="w-32 h-32 rounded-full mt-4 self-center mb-4" />}

                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 text-right"
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

                {/* Step 2: Professional Info */}
                {step === 2 && (
                    <>
                        <Text className="text-lg font-semibold mb-2 text-right">التخصصات</Text>
                        <View className="flex-row flex-wrap mb-4">
                            {SPECIALTIES.map((spec) => (
                                <Pressable
                                    key={spec}
                                    onPress={() => toggleSpecialty(spec)}
                                    className={`px-3 py-2 m-1 rounded-full border ${
                                        specialties.includes(spec)
                                            ? 'bg-green-500 border-green-700'
                                            : 'bg-gray-200 border-gray-400'
                                    }`}
                                >
                                    <Text className={specialties.includes(spec) ? 'text-white' : 'text-black'}>
                                        {spec}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 h-24 text-right"
                            placeholder="نبذة عنك"
                            multiline
                            value={bio}
                            onChangeText={setBio}
                        />

                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 text-right"
                            placeholder="السعر (بالدينار)"
                            keyboardType="numeric"
                            value={rate}
                            onChangeText={setRate}
                        />

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

                {/* Step 3: Address & Verification */}
                {step === 3 && (
                    <>
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 text-right"
                            placeholder="مكان الميلاد"
                            value={placeOfBirth}
                            onChangeText={setPlaceOfBirth}
                        />
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 text-right"
                            placeholder="عنوان الإقامة الحالي"
                            value={currentAddress}
                            onChangeText={setCurrentAddress}
                        />
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 text-right"
                            placeholder="رقم الرخصة المهنية"
                            value={licenseNumber}
                            onChangeText={setLicenseNumber}
                        />
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 text-right"
                            placeholder="سنوات الخبرة"
                            keyboardType="numeric"
                            value={yearsOfExperience}
                            onChangeText={setYearsOfExperience}
                        />

                        <Text className="text-lg font-semibold mb-2 text-right">رفع الشهادة المهنية *</Text>
                        <Pressable 
                            onPress={pickCertificate} 
                            className="p-3 bg-blue-600 rounded-lg active:opacity-70 mb-4"
                        >
                            <Text className="text-white text-center">اختيار الشهادة</Text>
                        </Pressable>
                        {certificate && (
                            <View className="mb-4">
                                <Image source={{ uri: certificate }} className="w-full h-48 rounded-lg" />
                                <Text className="text-green-600 text-sm text-right mt-2">تم اختيار الشهادة</Text>
                            </View>
                        )}

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
