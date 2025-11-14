import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native'
import { supabase } from '@/utils/supabaseClient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalTherapists: 0,
        verifiedTherapists: 0,
        pendingTherapists: 0,
        totalPatients: 0,
        totalAppointments: 0,
    })
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)

            // Get therapists stats
            const { data: therapists, error: therapistsError } = await supabase
                .from('profiles')
                .select('id, is_verified')
                .eq('role', 'psychologue')

            if (therapistsError) throw therapistsError

            const verified = therapists?.filter(t => t.is_verified).length || 0
            const pending = therapists?.filter(t => !t.is_verified).length || 0

            // Get patients count
            const { count: patientsCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'patient')

            // Get appointments count
            const { count: appointmentsCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })

            setStats({
                totalTherapists: therapists?.length || 0,
                verifiedTherapists: verified,
                pendingTherapists: pending,
                totalPatients: patientsCount || 0,
                totalAppointments: appointmentsCount || 0,
            })
        } catch (error: any) {
            console.error('Stats error:', error)
            Alert.alert('خطأ', 'فشل تحميل الإحصائيات')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-6 border-b border-gray-200">
                <Text className="text-2xl font-bold text-right">لوحة تحكم المدير</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Statistics Cards */}
                <View className="mb-4">
                    <Text className="text-xl font-bold mb-3 text-right">الإحصائيات</Text>
                    <View className="flex-row flex-wrap justify-between">
                        <View className="bg-white rounded-xl p-4 mb-3 w-[48%] border border-gray-200">
                            <Ionicons name="people" size={32} color="#3b82f6" />
                            <Text className="text-2xl font-bold mt-2 text-right">{stats.totalTherapists}</Text>
                            <Text className="text-gray-600 text-sm text-right">إجمالي الأخصائيين</Text>
                        </View>

                        <View className="bg-white rounded-xl p-4 mb-3 w-[48%] border border-gray-200">
                            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                            <Text className="text-2xl font-bold mt-2 text-right">{stats.verifiedTherapists}</Text>
                            <Text className="text-gray-600 text-sm text-right">متحقق</Text>
                        </View>

                        <View className="bg-white rounded-xl p-4 mb-3 w-[48%] border border-gray-200">
                            <Ionicons name="time" size={32} color="#f59e0b" />
                            <Text className="text-2xl font-bold mt-2 text-right">{stats.pendingTherapists}</Text>
                            <Text className="text-gray-600 text-sm text-right">قيد المراجعة</Text>
                        </View>

                        <View className="bg-white rounded-xl p-4 mb-3 w-[48%] border border-gray-200">
                            <Ionicons name="person" size={32} color="#8b5cf6" />
                            <Text className="text-2xl font-bold mt-2 text-right">{stats.totalPatients}</Text>
                            <Text className="text-gray-600 text-sm text-right">إجمالي المرضى</Text>
                        </View>

                        <View className="bg-white rounded-xl p-4 mb-3 w-full border border-gray-200">
                            <Ionicons name="calendar" size={32} color="#ef4444" />
                            <Text className="text-2xl font-bold mt-2 text-right">{stats.totalAppointments}</Text>
                            <Text className="text-gray-600 text-sm text-right">إجمالي المواعيد</Text>
                        </View>
                    </View>
                </View>

                {/* Admin Actions */}
                <View>
                    <Text className="text-xl font-bold mb-3 text-right">الإجراءات</Text>

                    <Pressable
                        onPress={() => router.push('/(root)/Screens/admin')}
                        className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                    >
                        <Ionicons name="shield-checkmark" size={28} color="#10b981" />
                        <View className="mr-4 flex-1">
                            <Text className="text-lg font-bold text-right">التحقق من الأخصائيين</Text>
                            <Text className="text-gray-600 text-sm text-right">
                                {stats.pendingTherapists > 0 
                                    ? `${stats.pendingTherapists} أخصائي في انتظار المراجعة`
                                    : 'جميع الأخصائيين متحقق منهم'}
                            </Text>
                        </View>
                        {stats.pendingTherapists > 0 && (
                            <View className="bg-red-500 rounded-full px-2 py-1">
                                <Text className="text-white text-xs">{stats.pendingTherapists}</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </Pressable>

                    <Pressable
                        onPress={() => router.push('/(root)/Screens/feed')}
                        className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                    >
                        <Ionicons name="newspaper-outline" size={28} color="#3b82f6" />
                        <View className="mr-4 flex-1">
                            <Text className="text-lg font-bold text-right">المنشورات</Text>
                            <Text className="text-gray-600 text-sm text-right">مراقبة المنشورات</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </Pressable>

                    <Pressable
                        onPress={() => router.push('/(root)/Screens/appointments')}
                        className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                    >
                        <Ionicons name="calendar-outline" size={28} color="#f59e0b" />
                        <View className="mr-4 flex-1">
                            <Text className="text-lg font-bold text-right">المواعيد</Text>
                            <Text className="text-gray-600 text-sm text-right">عرض جميع المواعيد</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </Pressable>

                    <Pressable
                        onPress={() => router.push('/(root)/Screens/profile')}
                        className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                    >
                        <Ionicons name="person-outline" size={28} color="#6366f1" />
                        <View className="mr-4 flex-1">
                            <Text className="text-lg font-bold text-right">الملف الشخصي</Text>
                            <Text className="text-gray-600 text-sm text-right">عرض وتعديل ملفك الشخصي</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    )
}

