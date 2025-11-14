import React, { useState, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    Pressable,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    SafeAreaView,
    Image,
} from 'react-native'
import { supabase } from '@/utils/supabaseClient'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'

interface Appointment {
    id: string
    patient_id: string
    therapist_id: string
    appointment_date: string | null
    requested_date?: string | null
    duration_minutes: number
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    notes: string | null
    created_at: string
    therapist: {
        id: string
        full_name: string
        avatar_url: string | null
    }
    patient: {
        id: string
        full_name: string
        avatar_url: string | null
    }
}

interface Therapist {
    id: string
    full_name: string
    avatar_url: string | null
    rate: number | null
}

const TherapistAppointmentActions = ({ 
    appointment, 
    onConfirm, 
    onReject 
}: { 
    appointment: Appointment
    onConfirm: (date: Date) => void
    onReject: () => void
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [selectedDate, setSelectedDate] = useState(
        appointment.requested_date ? new Date(appointment.requested_date) : new Date()
    )
    const [selectedTime, setSelectedTime] = useState(
        appointment.requested_date ? new Date(appointment.requested_date) : new Date()
    )

    const handleConfirm = () => {
        const appointmentDateTime = new Date(selectedDate)
        appointmentDateTime.setHours(selectedTime.getHours())
        appointmentDateTime.setMinutes(selectedTime.getMinutes())
        onConfirm(appointmentDateTime)
    }

    return (
        <View className="mt-2">
            {appointment.requested_date && (
                <Text className="text-sm text-gray-600 text-right mb-2">
                    طلب المريض: {new Date(appointment.requested_date).toLocaleString('ar-SA')}
                </Text>
            )}
            <View className="flex-row gap-2 mb-2">
                <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className="flex-1 border border-gray-300 rounded-lg p-2"
                >
                    <Text className="text-right text-sm">
                        التاريخ: {selectedDate.toLocaleDateString('ar-SA')}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => setShowTimePicker(true)}
                    className="flex-1 border border-gray-300 rounded-lg p-2"
                >
                    <Text className="text-right text-sm">
                        الوقت: {selectedTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </Pressable>
            </View>
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, date) => {
                        setShowDatePicker(false)
                        if (date) setSelectedDate(date)
                    }}
                />
            )}
            {showTimePicker && (
                <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="default"
                    onChange={(event, time) => {
                        setShowTimePicker(false)
                        if (time) setSelectedTime(time)
                    }}
                />
            )}
            <View className="flex-row gap-2">
                <Pressable
                    onPress={handleConfirm}
                    className="flex-1 bg-blue-500 p-2 rounded-lg"
                >
                    <Text className="text-white text-center font-semibold">تأكيد</Text>
                </Pressable>
                <Pressable
                    onPress={onReject}
                    className="flex-1 bg-red-500 p-2 rounded-lg"
                >
                    <Text className="text-white text-center font-semibold">رفض</Text>
                </Pressable>
            </View>
        </View>
    )
}

export default function Appointments() {
    const { therapistId } = useLocalSearchParams<{ therapistId?: string }>()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedTime, setSelectedTime] = useState(new Date())
    const [duration, setDuration] = useState(60)
    const [notes, setNotes] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [booking, setBooking] = useState(false)
    const [currentUser, setCurrentUser] = useState<string | null>(null)
    const router = useRouter()

    const checkAccessPermission = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.back()
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, is_verified')
                .eq('id', user.id)
                .single()

            // Block unverified psychologues
            if (profile?.role === 'psychologue' && !profile?.is_verified) {
                Alert.alert(
                    'حساب قيد المراجعة',
                    'لا يمكنك الوصول إلى المواعيد حتى يتم التحقق من حسابك من قبل الإدارة.'
                )
                router.back()
            }
        } catch (error) {
            console.error('Permission check error:', error)
        }
    }, [router])

    useEffect(() => {
        checkAccessPermission()
        getCurrentUser()
        if (therapistId) {
            fetchTherapist(therapistId)
            setShowBookingModal(true)
        }
        fetchAppointments()
    }, [therapistId, checkAccessPermission])

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user?.id || null)
    }

    const fetchTherapist = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, rate')
                .eq('id', id)
                .single()

            if (error) throw error
            setSelectedTherapist(data as Therapist)
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحميل معلومات الأخصائي')
        }
    }

    const fetchAppointments = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    therapist:therapist_id (
                        id,
                        full_name,
                        avatar_url
                    ),
                    patient:patient_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .or(`patient_id.eq.${user.id},therapist_id.eq.${user.id}`)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Fetch appointments error:', error)
                throw error
            }

            // Ensure all appointments have requested_date set (for backward compatibility)
            const normalizedAppointments = (data || []).map((apt: any) => ({
                ...apt,
                requested_date: apt.requested_date || apt.appointment_date || apt.created_at,
            }))

            setAppointments(normalizedAppointments)
        } catch (error: any) {
            console.error('Error fetching appointments:', error)
            Alert.alert('خطأ', error.message || 'فشل تحميل المواعيد')
        } finally {
            setLoading(false)
        }
    }

    const handleBookAppointment = async () => {
        if (!selectedTherapist || !currentUser) return

        // Combine date and time for requested date
        const requestedDateTime = new Date(selectedDate)
        requestedDateTime.setHours(selectedTime.getHours())
        requestedDateTime.setMinutes(selectedTime.getMinutes())

        if (requestedDateTime < new Date()) {
            Alert.alert('خطأ', 'يرجى اختيار تاريخ ووقت في المستقبل')
            return
        }

        setBooking(true)
        try {
            // Try to insert with requested_date first (new schema)
            let insertData: any = {
                patient_id: currentUser,
                therapist_id: selectedTherapist.id,
                duration_minutes: duration,
                notes: notes.trim() || null,
                status: 'pending',
            }

            // Check if requested_date column exists by trying to insert it
            // If it fails, fall back to using appointment_date
            try {
                insertData.requested_date = requestedDateTime.toISOString()
                insertData.appointment_date = null
            } catch {
                // Fallback for old schema
                insertData.appointment_date = requestedDateTime.toISOString()
            }

            const { error } = await supabase
                .from('appointments')
                .insert(insertData)
                .select(`
                    *,
                    therapist:therapist_id (
                        id,
                        full_name,
                        avatar_url
                    ),
                    patient:patient_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .single()

            if (error) {
                // If error is about requested_date column, try without it
                if (error.message.includes('requested_date') || error.message.includes('column')) {
                    insertData = {
                        patient_id: currentUser,
                        therapist_id: selectedTherapist.id,
                        appointment_date: requestedDateTime.toISOString(),
                        duration_minutes: duration,
                        notes: notes.trim() || null,
                        status: 'pending',
                    }
                    const { error: retryError } = await supabase
                        .from('appointments')
                        .insert(insertData)
                        .select(`
                            *,
                            therapist:therapist_id (
                                id,
                                full_name,
                                avatar_url
                            ),
                            patient:patient_id (
                                id,
                                full_name,
                                avatar_url
                            )
                        `)
                        .single()
                    
                    if (retryError) throw retryError
                    Alert.alert('نجح', 'تم إرسال طلب الموعد. سيتم تأكيده من قبل الأخصائي.')
                    setShowBookingModal(false)
                    setSelectedDate(new Date())
                    setSelectedTime(new Date())
                    setDuration(60)
                    setNotes('')
                    fetchAppointments()
                    return
                }
                throw error
            }

            Alert.alert('نجح', 'تم إرسال طلب الموعد. سيتم تأكيده من قبل الأخصائي.')
            setShowBookingModal(false)
            setSelectedDate(new Date())
            setSelectedTime(new Date())
            setDuration(60)
            setNotes('')
            fetchAppointments()
        } catch (error: any) {
            console.error('Booking error:', error)
            Alert.alert('خطأ', error.message || 'فشل إرسال طلب الموعد')
        } finally {
            setBooking(false)
        }
    }

    const handleUpdateStatus = async (appointmentId: string, newStatus: string, appointmentDate?: Date) => {
        try {
            const updateData: any = { status: newStatus }
            if (appointmentDate && newStatus === 'confirmed') {
                updateData.appointment_date = appointmentDate.toISOString()
            }
            
            const { error } = await supabase
                .from('appointments')
                .update(updateData)
                .eq('id', appointmentId)

            if (error) throw error

            fetchAppointments()
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحديث حالة الموعد')
        }
    }

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'غير محدد'
        const date = new Date(dateString)
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'confirmed':
                return 'bg-blue-100 text-blue-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'قيد الانتظار'
            case 'confirmed':
                return 'مؤكد'
            case 'completed':
                return 'مكتمل'
            case 'cancelled':
                return 'ملغي'
            default:
                return status
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-right">المواعيد</Text>
                <Pressable
                    onPress={() => {
                        setSelectedTherapist(null)
                        setShowBookingModal(true)
                    }}
                    className="bg-blue-500 px-4 py-2 rounded-full"
                >
                    <Ionicons name="add" size={24} color="white" />
                </Pressable>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" />
                </View>
            ) : appointments.length === 0 ? (
                <View className="flex-1 justify-center items-center py-20">
                    <Ionicons name="calendar-outline" size={64} color="gray" />
                    <Text className="text-gray-500 text-lg mt-4">لا توجد مواعيد</Text>
                </View>
            ) : (
                <ScrollView className="flex-1 p-4">
                    {appointments.map(appointment => {
                        const otherPerson =
                            currentUser === appointment.patient_id
                                ? appointment.therapist
                                : appointment.patient
                        const isTherapist = currentUser === appointment.therapist_id

                        return (
                            <View
                                key={appointment.id}
                                className="bg-white rounded-xl p-4 mb-4 border border-gray-200"
                            >
                                <View className="flex-row items-center mb-3">
                                    {otherPerson?.avatar_url ? (
                                        <Image
                                            source={{ uri: otherPerson.avatar_url }}
                                            className="w-12 h-12 rounded-full"
                                        />
                                    ) : (
                                        <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
                                            <Ionicons name="person" size={24} color="gray" />
                                        </View>
                                    )}
                                    <View className="mr-3 flex-1">
                                        <Text className="font-bold text-lg text-right">
                                            {otherPerson?.full_name || 'مستخدم'}
                                        </Text>
                                        {appointment.status === 'confirmed' && appointment.appointment_date ? (
                                            <Text className="text-gray-500 text-sm text-right">
                                                {formatDateTime(appointment.appointment_date)}
                                            </Text>
                                        ) : appointment.requested_date ? (
                                            <Text className="text-gray-500 text-sm text-right">
                                                مطلوب: {formatDateTime(appointment.requested_date)}
                                            </Text>
                                        ) : appointment.appointment_date ? (
                                            <Text className="text-gray-500 text-sm text-right">
                                                {formatDateTime(appointment.appointment_date)}
                                            </Text>
                                        ) : (
                                            <Text className="text-gray-500 text-sm text-right">
                                                تاريخ غير محدد
                                            </Text>
                                        )}
                                    </View>
                                    <View
                                        className={`px-3 py-1 rounded-full ${getStatusColor(
                                            appointment.status
                                        )}`}
                                    >
                                        <Text className="text-xs font-semibold">
                                            {getStatusText(appointment.status)}
                                        </Text>
                                    </View>
                                </View>

                                {appointment.notes && (
                                    <Text className="text-gray-600 text-sm text-right mb-3">
                                        {appointment.notes}
                                    </Text>
                                )}

                                <Text className="text-gray-500 text-sm text-right mb-3">
                                    المدة: {appointment.duration_minutes} دقيقة
                                </Text>

                                {isTherapist && appointment.status === 'pending' && appointment.requested_date && (
                                    <TherapistAppointmentActions 
                                        appointment={appointment}
                                        onConfirm={(date) => handleUpdateStatus(appointment.id, 'confirmed', date)}
                                        onReject={() => handleUpdateStatus(appointment.id, 'cancelled')}
                                    />
                                )}
                                {isTherapist && appointment.status === 'pending' && !appointment.requested_date && (
                                    <View className="flex-row gap-2 mt-2">
                                        <Pressable
                                            onPress={() => handleUpdateStatus(appointment.id, 'confirmed')}
                                            className="flex-1 bg-blue-500 p-2 rounded-lg"
                                        >
                                            <Text className="text-white text-center font-semibold">تأكيد</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => handleUpdateStatus(appointment.id, 'cancelled')}
                                            className="flex-1 bg-red-500 p-2 rounded-lg"
                                        >
                                            <Text className="text-white text-center font-semibold">إلغاء</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {!isTherapist && appointment.status === 'pending' && (
                                    <Pressable
                                        onPress={() => handleUpdateStatus(appointment.id, 'cancelled')}
                                        className="bg-red-500 p-2 rounded-lg mt-2"
                                    >
                                        <Text className="text-white text-center font-semibold">
                                            إلغاء الموعد
                                        </Text>
                                    </Pressable>
                                )}

                                {appointment.status === 'confirmed' && (
                                    <Pressable
                                        onPress={async () => {
                                            const { data: { user } } = await supabase.auth.getUser()
                                            if (!user) return

                                            // Check if room exists
                                            const { data: existingRoom } = await supabase
                                                .from('chat_rooms')
                                                .select('id')
                                                .eq('patient_id', appointment.patient_id)
                                                .eq('therapist_id', appointment.therapist_id)
                                                .maybeSingle()

                                            if (existingRoom) {
                                                router.push(`/(root)/Screens/chat?roomId=${existingRoom.id}`)
                                            } else {
                                                // Create new room
                                                const { data: newRoom, error } = await supabase
                                                    .from('chat_rooms')
                                                    .insert({
                                                        patient_id: appointment.patient_id,
                                                        therapist_id: appointment.therapist_id,
                                                    })
                                                    .select('id')
                                                    .single()

                                                if (error) {
                                                    Alert.alert('خطأ', error.message || 'فشل إنشاء المحادثة')
                                                } else {
                                                    router.push(`/(root)/Screens/chat?roomId=${newRoom.id}`)
                                                }
                                            }
                                        }}
                                        className="bg-purple-500 p-2 rounded-lg mt-2"
                                    >
                                        <Text className="text-white text-center font-semibold">
                                            بدء المحادثة
                                        </Text>
                                    </Pressable>
                                )}

                                {!isTherapist && appointment.status === 'completed' && (
                                    <Pressable
                                        onPress={() => router.push(`/(root)/Screens/rating?therapistId=${appointment.therapist_id}&appointmentId=${appointment.id}`)}
                                        className="bg-yellow-500 p-2 rounded-lg mt-2"
                                    >
                                        <Text className="text-white text-center font-semibold">
                                            تقييم الأخصائي
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        )
                    })}
                </ScrollView>
            )}

            {/* Booking Modal */}
            <Modal visible={showBookingModal} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
                        <View className="flex-row justify-between items-center mb-4">
                            <Pressable onPress={() => setShowBookingModal(false)}>
                                <Ionicons name="close" size={28} color="gray" />
                            </Pressable>
                            <Text className="text-xl font-bold text-right">حجز موعد</Text>
                        </View>

                        <ScrollView>
                            {selectedTherapist && (
                                <View className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <Text className="font-semibold text-right mb-2">
                                        {selectedTherapist.full_name}
                                    </Text>
                                    {selectedTherapist.rate && (
                                        <Text className="text-green-600 text-right">
                                            {selectedTherapist.rate} د.أ
                                        </Text>
                                    )}
                                </View>
                            )}

                            <Pressable
                                onPress={() => setShowDatePicker(true)}
                                className="border border-gray-300 rounded-lg p-3 mb-3"
                            >
                                <Text className="text-right">
                                    التاريخ: {selectedDate.toLocaleDateString('ar-SA')}
                                </Text>
                            </Pressable>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display="default"
                                    minimumDate={new Date()}
                                    onChange={(event, date) => {
                                        setShowDatePicker(false)
                                        if (date) setSelectedDate(date)
                                    }}
                                />
                            )}

                            <Pressable
                                onPress={() => setShowTimePicker(true)}
                                className="border border-gray-300 rounded-lg p-3 mb-3"
                            >
                                <Text className="text-right">
                                    الوقت: {selectedTime.toLocaleTimeString('ar-SA', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            </Pressable>

                            {showTimePicker && (
                                <DateTimePicker
                                    value={selectedTime}
                                    mode="time"
                                    display="default"
                                    onChange={(event, time) => {
                                        setShowTimePicker(false)
                                        if (time) setSelectedTime(time)
                                    }}
                                />
                            )}

                            <View className="mb-3">
                                <Text className="text-right mb-2">المدة (بالدقائق)</Text>
                                <View className="flex-row">
                                    {[30, 60, 90, 120].map(mins => (
                                        <Pressable
                                            key={mins}
                                            onPress={() => setDuration(mins)}
                                            className={`px-4 py-2 mr-2 rounded-lg ${
                                                duration === mins ? 'bg-blue-500' : 'bg-gray-200'
                                            }`}
                                        >
                                            <Text
                                                className={duration === mins ? 'text-white' : 'text-gray-700'}
                                            >
                                                {mins}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 mb-4 h-24 text-right"
                                placeholder="ملاحظات (اختياري)"
                                multiline
                                value={notes}
                                onChangeText={setNotes}
                            />

                            <Pressable
                                onPress={handleBookAppointment}
                                disabled={booking || !selectedTherapist}
                                className="bg-blue-500 p-4 rounded-lg"
                            >
                                {booking ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-center text-lg font-bold">
                                        حجز الموعد
                                    </Text>
                                )}
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

