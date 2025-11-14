import { supabase } from '@/utils/supabaseClient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState, useCallback } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from 'react-native'

interface Therapist {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    bio: string | null
    specialties: string[] | null
    rate: number | null
    is_verified: boolean
    license_number: string | null
    years_of_experience: number | null
    created_at: string
}

export default function AdminScreen() {
    const [therapists, setTherapists] = useState<Therapist[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [verifying, setVerifying] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const router = useRouter()

    const checkAdminAccess = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.replace('../login')
                return
            }

            // Check if user is admin
            // Option 1: Check if user has admin role in profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, email')
                .eq('id', user.id)
                .maybeSingle()

            // Option 2: Check if email is in admin list (fallback)
            const adminEmails = [
                'admin@tenfis.com',
                // Add your admin emails here
            ]

            const userIsAdmin = Boolean(
                profile?.role === 'admin' ||
                adminEmails.includes(user.email || '') ||
                user.email?.toLowerCase().includes('admin') // Temporary: allow any email with 'admin'
            )

            setIsAdmin(userIsAdmin)

            if (!userIsAdmin) {
                Alert.alert('غير مصرح', 'ليس لديك صلاحية للوصول إلى هذه الصفحة')
                router.back()
            }
        } catch (error: any) {
            console.error('Admin check error:', error)
            Alert.alert('خطأ', 'فشل التحقق من الصلاحيات')
        }
    }, [router])

    useEffect(() => {
        checkAdminAccess()
        fetchTherapists()
    }, [checkAdminAccess])

    const fetchTherapists = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'psychologue')
                .order('created_at', { ascending: false })

            if (error) throw error

            setTherapists(data || [])
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحميل الأخصائيين')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleVerify = async (therapistId: string, verify: boolean) => {
        setVerifying(therapistId)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_verified: verify })
                .eq('id', therapistId)

            if (error) throw error

            Alert.alert(
                'نجح',
                verify ? 'تم التحقق من الأخصائي بنجاح' : 'تم إلغاء التحقق من الأخصائي'
            )

            // Refresh list
            fetchTherapists()
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحديث حالة التحقق')
        } finally {
            setVerifying(null)
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        fetchTherapists()
    }

    if (!isAdmin) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-3 border-b border-gray-200">
                <Text className="text-2xl font-bold text-right">لوحة التحكم - التحقق من الأخصائيين</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {therapists.length === 0 ? (
                        <View className="flex-1 justify-center items-center py-20">
                            <Ionicons name="people-outline" size={64} color="gray" />
                            <Text className="text-gray-500 text-lg mt-4">لا يوجد أخصائيين</Text>
                        </View>
                    ) : (
                        therapists.map(therapist => (
                            <View
                                key={therapist.id}
                                className="bg-white rounded-xl p-4 mb-4 mx-4 border border-gray-200"
                            >
                                <View className="flex-row items-start">
                                    {therapist.avatar_url ? (
                                        <Image
                                            source={{ uri: therapist.avatar_url }}
                                            className="w-16 h-16 rounded-full"
                                        />
                                    ) : (
                                        <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
                                            <Ionicons name="person" size={32} color="gray" />
                                        </View>
                                    )}
                                    <View className="mr-3 flex-1">
                                        <View className="flex-row items-center mb-2">
                                            <Text className="text-lg font-bold text-right flex-1">
                                                {therapist.full_name || 'بدون اسم'}
                                            </Text>
                                            {therapist.is_verified ? (
                                                <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
                                                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                                    <Text className="text-green-700 text-xs mr-1">متحقق</Text>
                                                </View>
                                            ) : (
                                                <View className="flex-row items-center bg-yellow-100 px-2 py-1 rounded-full">
                                                    <Ionicons name="time-outline" size={16} color="#f59e0b" />
                                                    <Text className="text-yellow-700 text-xs mr-1">قيد المراجعة</Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text className="text-gray-600 text-sm text-right mb-1">
                                            {therapist.email}
                                        </Text>

                                        {therapist.license_number && (
                                            <Text className="text-gray-600 text-sm text-right mb-1">
                                                الرخصة: {therapist.license_number}
                                            </Text>
                                        )}

                                        {therapist.years_of_experience && (
                                            <Text className="text-gray-600 text-sm text-right mb-1">
                                                سنوات الخبرة: {therapist.years_of_experience}
                                            </Text>
                                        )}

                                        {therapist.specialties && therapist.specialties.length > 0 && (
                                            <View className="flex-row flex-wrap mt-2">
                                                {therapist.specialties.slice(0, 3).map((spec, idx) => (
                                                    <View
                                                        key={idx}
                                                        className="bg-blue-100 px-2 py-1 rounded-full mr-1 mb-1"
                                                    >
                                                        <Text className="text-xs text-blue-700">{spec}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}

                                        {therapist.bio && (
                                            <Text className="text-gray-600 text-sm text-right mt-2" numberOfLines={2}>
                                                {therapist.bio}
                                            </Text>
                                        )}

                                        <View className="flex-row gap-2 mt-3">
                                            {therapist.is_verified ? (
                                                <Pressable
                                                    onPress={() => handleVerify(therapist.id, false)}
                                                    disabled={verifying === therapist.id}
                                                    className="flex-1 bg-red-500 p-3 rounded-lg"
                                                >
                                                    {verifying === therapist.id ? (
                                                        <ActivityIndicator color="white" />
                                                    ) : (
                                                        <Text className="text-white text-center font-bold">
                                                            إلغاء التحقق
                                                        </Text>
                                                    )}
                                                </Pressable>
                                            ) : (
                                                <Pressable
                                                    onPress={() => handleVerify(therapist.id, true)}
                                                    disabled={verifying === therapist.id}
                                                    className="flex-1 bg-green-500 p-3 rounded-lg"
                                                >
                                                    {verifying === therapist.id ? (
                                                        <ActivityIndicator color="white" />
                                                    ) : (
                                                        <Text className="text-white text-center font-bold">
                                                            التحقق
                                                        </Text>
                                                    )}
                                                </Pressable>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    )
}

