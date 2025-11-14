import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
    SafeAreaView,
} from 'react-native'
import { supabase } from '@/utils/supabaseClient'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

interface Rating {
    id: string
    therapist_id: string
    patient_id: string
    appointment_id: string | null
    rating: number
    comment: string | null
    created_at: string
    updated_at: string
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

interface TherapistRating {
    therapist_id: string
    average_rating: number
    total_ratings: number
    ratings: Rating[]
}

export default function RatingScreen() {
    const { therapistId, appointmentId } = useLocalSearchParams<{ therapistId?: string; appointmentId?: string }>()
    const [therapistRatings, setTherapistRatings] = useState<TherapistRating | null>(null)
    const [userRating, setUserRating] = useState<Rating | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [selectedRating, setSelectedRating] = useState(0)
    const [comment, setComment] = useState('')
    const [currentUser, setCurrentUser] = useState<string | null>(null)

    useEffect(() => {
        getCurrentUser()
        if (therapistId) {
            fetchRatings(therapistId)
            fetchUserRating(therapistId, appointmentId || null)
        }
    }, [therapistId, appointmentId])

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user?.id || null)
    }

    const fetchRatings = async (id: string) => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('ratings')
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
                .eq('therapist_id', id)
                .order('created_at', { ascending: false })

            if (error) throw error

            const ratings = (data || []) as Rating[]
            const average =
                ratings.length > 0
                    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                    : 0

            setTherapistRatings({
                therapist_id: id,
                average_rating: average,
                total_ratings: ratings.length,
                ratings,
            })
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحميل التقييمات')
        } finally {
            setLoading(false)
        }
    }

    const fetchUserRating = async (therapistId: string, appointmentId: string | null) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('ratings')
                .select('*')
                .eq('therapist_id', therapistId)
                .eq('patient_id', user.id)
                .eq('appointment_id', appointmentId || null)
                .maybeSingle()

            if (error && error.code !== 'PGRST116') throw error

            if (data) {
                setUserRating(data)
                setSelectedRating(data.rating)
                setComment(data.comment || '')
            }
        } catch (error: any) {
            console.error('Error fetching user rating:', error)
        }
    }

    const handleSubmitRating = async () => {
        if (!selectedRating || !therapistId || !currentUser) {
            Alert.alert('تنبيه', 'يرجى اختيار تقييم')
            return
        }

        setSubmitting(true)
        try {
            if (userRating) {
                // Update existing rating
                const { error } = await supabase
                    .from('ratings')
                    .update({
                        rating: selectedRating,
                        comment: comment.trim() || null,
                    })
                    .eq('id', userRating.id)

                if (error) throw error

                Alert.alert('نجح', 'تم تحديث التقييم بنجاح')
            } else {
                // Create new rating
                const { error } = await supabase.from('ratings').insert({
                    therapist_id: therapistId,
                    patient_id: currentUser,
                    appointment_id: appointmentId || null,
                    rating: selectedRating,
                    comment: comment.trim() || null,
                })

                if (error) throw error

                Alert.alert('نجح', 'تم إضافة التقييم بنجاح')
            }

            // Refresh ratings
            fetchRatings(therapistId)
            fetchUserRating(therapistId, appointmentId || null)
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل حفظ التقييم')
        } finally {
            setSubmitting(false)
        }
    }

    const renderStars = (rating: number, interactive = false, onPress?: (rating: number) => void) => {
        return (
            <View className="flex-row">
                {[1, 2, 3, 4, 5].map(star => (
                    <Pressable
                        key={star}
                        onPress={interactive && onPress ? () => onPress(star) : undefined}
                        disabled={!interactive}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={24}
                            color={star <= rating ? '#fbbf24' : '#d1d5db'}
                        />
                    </Pressable>
                ))}
            </View>
        )
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-3 border-b border-gray-200">
                <Text className="text-2xl font-bold text-right">التقييمات</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Average Rating Summary */}
                {therapistRatings && (
                    <View className="bg-white rounded-xl p-6 mb-4 border border-gray-200 items-center">
                        <Text className="text-4xl font-bold mb-2">
                            {therapistRatings.average_rating.toFixed(1)}
                        </Text>
                        {renderStars(Math.round(therapistRatings.average_rating))}
                        <Text className="text-gray-600 mt-2">
                            بناءً على {therapistRatings.total_ratings} تقييم
                        </Text>
                    </View>
                )}

                {/* Add/Edit Rating Form */}
                {currentUser && (
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <Text className="text-lg font-bold mb-4 text-right">
                            {userRating ? 'تعديل تقييمك' : 'أضف تقييمك'}
                        </Text>

                        <View className="mb-4">
                            <Text className="text-right mb-2">التقييم</Text>
                            {renderStars(selectedRating, true, setSelectedRating)}
                        </View>

                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 h-24 text-right"
                            placeholder="اكتب تعليقك (اختياري)"
                            multiline
                            value={comment}
                            onChangeText={setComment}
                        />

                        <Pressable
                            onPress={handleSubmitRating}
                            disabled={submitting || selectedRating === 0}
                            className="bg-blue-500 p-3 rounded-lg"
                        >
                            {submitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-center font-bold">
                                    {userRating ? 'تحديث' : 'إرسال'}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                )}

                {/* Ratings List */}
                {therapistRatings && therapistRatings.ratings.length > 0 ? (
                    <View>
                        <Text className="text-lg font-bold mb-4 text-right">جميع التقييمات</Text>
                        {therapistRatings.ratings.map(rating => (
                            <View
                                key={rating.id}
                                className="bg-white rounded-xl p-4 mb-4 border border-gray-200"
                            >
                                <View className="flex-row items-center mb-3">
                                    {rating.patient?.avatar_url ? (
                                        <Image
                                            source={{ uri: rating.patient.avatar_url }}
                                            className="w-10 h-10 rounded-full"
                                        />
                                    ) : (
                                        <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center">
                                            <Ionicons name="person" size={20} color="gray" />
                                        </View>
                                    )}
                                    <View className="mr-3 flex-1">
                                        <Text className="font-bold text-right">
                                            {rating.patient?.full_name || 'مستخدم'}
                                        </Text>
                                        <Text className="text-gray-500 text-xs text-right">
                                            {formatDate(rating.created_at)}
                                        </Text>
                                    </View>
                                    {renderStars(rating.rating)}
                                </View>

                                {rating.comment && (
                                    <Text className="text-gray-700 text-right leading-6">
                                        {rating.comment}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View className="bg-white rounded-xl p-6 items-center">
                        <Ionicons name="star-outline" size={64} color="gray" />
                        <Text className="text-gray-500 text-lg mt-4">لا توجد تقييمات بعد</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

