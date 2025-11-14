// app/Screens/psychologue/Mainps.tsx
import { View, Text, Pressable, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'

export default function Mainps() {
    const router = useRouter()
    const [isVerified, setIsVerified] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkVerificationStatus()
    }, [])

    const checkVerificationStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_verified')
                .eq('id', user.id)
                .single()

            setIsVerified(profile?.is_verified ?? false)
        } catch (err) {
            console.error('Error checking verification:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRestrictedAccess = () => {
        Alert.alert(
            'حساب قيد المراجعة',
            'يجب أن يتم التحقق من حسابك من قبل الإدارة أولاً قبل الوصول إلى هذه الميزة. يمكنك فقط مشاهدة المنشورات في الوقت الحالي.'
        )
    }

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.replace('/(root)/Screens/login')
        } catch {
            Alert.alert('خطأ', 'فشل تسجيل الخروج')
        }
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-6 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <Pressable onPress={handleLogout}>
                        <Ionicons name="log-out" size={24} color="#ef4444" />
                    </Pressable>
                    <View>
                        <Text className="text-2xl font-bold text-right">مرحباً</Text>
                        {!isVerified && (
                            <View className="flex-row items-center justify-end mt-2 bg-yellow-100 px-3 py-1 rounded-full">
                                <Text className="text-yellow-700 text-xs font-semibold text-right mr-1">
                                    قيد المراجعة
                                </Text>
                                <Ionicons name="time-outline" size={14} color="#f59e0b" />
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                <Pressable
                    onPress={() => isVerified ? router.push('../feed') : router.push('../feed')}
                    className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                >
                    <Ionicons name="newspaper-outline" size={28} color="#3b82f6" />
                    <View className="mr-4 flex-1">
                        <Text className="text-lg font-bold text-right">المنشورات</Text>
                        <Text className="text-gray-600 text-sm text-right">تصفح المنشورات</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </Pressable>

                <Pressable
                    onPress={() => isVerified ? router.push('../appointments') : handleRestrictedAccess()}
                    className={`bg-white rounded-xl p-4 mb-4 border flex-row items-center active:opacity-70 ${
                        isVerified ? 'border-gray-200' : 'border-gray-300 opacity-60'
                    }`}
                >
                    <Ionicons name="calendar-outline" size={28} color={isVerified ? '#f59e0b' : '#d1d5db'} />
                    <View className="mr-4 flex-1">
                        <View className="flex-row items-center">
                            <Text className="text-lg font-bold text-right">المواعيد</Text>
                            {!isVerified && (
                                <View className="bg-red-100 px-2 py-1 rounded ml-2">
                                    <Text className="text-red-700 text-xs">مغلق</Text>
                                </View>
                            )}
                        </View>
                        <Text className={`text-sm text-right ${
                            isVerified ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                            {isVerified ? 'إدارة مواعيدك' : 'متاح بعد التحقق'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={isVerified ? 'gray' : '#d1d5db'} />
                </Pressable>

                <Pressable
                    onPress={() => isVerified ? router.push('../chat') : handleRestrictedAccess()}
                    className={`bg-white rounded-xl p-4 mb-4 border flex-row items-center active:opacity-70 ${
                        isVerified ? 'border-gray-200' : 'border-gray-300 opacity-60'
                    }`}
                >
                    <Ionicons name="chatbubbles-outline" size={28} color={isVerified ? '#8b5cf6' : '#d1d5db'} />
                    <View className="mr-4 flex-1">
                        <View className="flex-row items-center">
                            <Text className="text-lg font-bold text-right">المحادثات</Text>
                            {!isVerified && (
                                <View className="bg-red-100 px-2 py-1 rounded ml-2">
                                    <Text className="text-red-700 text-xs">مغلق</Text>
                                </View>
                            )}
                        </View>
                        <Text className={`text-sm text-right ${
                            isVerified ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                            {isVerified ? 'تواصل مع مرضاك' : 'متاح بعد التحقق'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={isVerified ? 'gray' : '#d1d5db'} />
                </Pressable>

                <Pressable
                    onPress={() => router.push('../profile')}
                    className={`bg-white rounded-xl p-4 mb-4 border flex-row items-center active:opacity-70 ${
                        !isVerified ? 'border-gray-300 opacity-60' : 'border-gray-200'
                    }`}
                >
                    <Ionicons name="person-outline" size={28} color={isVerified ? '#6366f1' : '#d1d5db'} />
                    <View className="mr-4 flex-1">
                        <Text className="text-lg font-bold text-right">الملف الشخصي</Text>
                        <Text className={`text-sm text-right ${
                            isVerified ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                            {isVerified ? 'عرض وتعديل ملفك الشخصي' : 'عرض فقط - غير متاح للتعديل'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={isVerified ? 'gray' : '#d1d5db'} />
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    )
}
