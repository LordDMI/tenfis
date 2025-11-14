import React, { useState, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    Image,
    Modal,
    Alert,
    SafeAreaView,
} from 'react-native'
import { supabase } from '@/utils/supabaseClient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

interface Therapist {
    id: string
    full_name: string
    avatar_url: string | null
    bio: string | null
    specialties: string[] | null
    rate: number | null
    is_verified: boolean
    years_of_experience: number
    license_number: string | null
}

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

const TherapistCard = ({ therapist, onPress }: { therapist: Therapist; onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        className="bg-white rounded-xl p-4 mb-4 border border-gray-200 active:opacity-70"
    >
        <View className="flex-row items-start">
            {therapist.avatar_url ? (
                <Image source={{ uri: therapist.avatar_url }} className="w-16 h-16 rounded-full" />
            ) : (
                <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
                    <Ionicons name="person" size={32} color="gray" />
                </View>
            )}
            <View className="mr-3 flex-1">
                <View className="flex-row items-center mb-1">
                    <Text className="text-lg font-bold text-right flex-1">{therapist.full_name}</Text>
                    {therapist.is_verified && (
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    )}
                </View>
                {therapist.specialties && therapist.specialties.length > 0 && (
                    <View className="flex-row flex-wrap mb-2">
                        {therapist.specialties.slice(0, 2).map((spec, idx) => (
                            <View key={idx} className="bg-blue-100 px-2 py-1 rounded-full mr-1 mb-1">
                                <Text className="text-xs text-blue-700">{spec}</Text>
                            </View>
                        ))}
                        {therapist.specialties.length > 2 && (
                            <View className="bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1">
                                <Text className="text-xs text-gray-700">+{therapist.specialties.length - 2}</Text>
                            </View>
                        )}
                    </View>
                )}
                {therapist.bio && (
                    <Text className="text-gray-600 text-sm text-right mb-2" numberOfLines={2}>
                        {therapist.bio}
                    </Text>
                )}
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <Ionicons name="star" size={16} color="#fbbf24" />
                        <Text className="mr-1 text-sm text-gray-600">
                            {therapist.years_of_experience} سنوات خبرة
                        </Text>
                    </View>
                    {therapist.rate && (
                        <Text className="text-lg font-bold text-green-600">
                            {therapist.rate} د.أ
                        </Text>
                    )}
                </View>
            </View>
        </View>
    </Pressable>
)

const TherapistSkeleton = () => (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
        <View className="flex-row items-start">
            <View className="w-16 h-16 rounded-full bg-gray-300" />
            <View className="mr-3 flex-1">
                <View className="h-5 bg-gray-300 rounded w-32 mb-2" />
                <View className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <View className="h-3 bg-gray-200 rounded w-full mb-1" />
                <View className="h-3 bg-gray-200 rounded w-3/4" />
            </View>
        </View>
    </View>
)

export default function TherapistSearch() {
    const [therapists, setTherapists] = useState<Therapist[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
    const [showFilters, setShowFilters] = useState(false)
    const [sortBy, setSortBy] = useState<'rate' | 'experience' | 'name'>('rate')
    const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
    const router = useRouter()

    const fetchTherapists = useCallback(async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'psychologue')
                .eq('is_verified', true) // Only show verified therapists

            // Apply specialty filter
            if (selectedSpecialties.length > 0) {
                query = query.contains('specialties', selectedSpecialties)
            }

            const { data, error } = await query

            if (error) throw error

            // Sort results
            let sorted = [...(data || [])]
            if (sortBy === 'rate') {
                sorted.sort((a, b) => (b.rate || 0) - (a.rate || 0))
            } else if (sortBy === 'experience') {
                sorted.sort((a, b) => (b.years_of_experience || 0) - (a.years_of_experience || 0))
            } else {
                sorted.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'ar'))
            }

            // Apply search filter
            if (searchQuery.trim()) {
                const queryLower = searchQuery.toLowerCase()
                sorted = sorted.filter(
                    t =>
                        t.full_name?.toLowerCase().includes(queryLower) ||
                        t.bio?.toLowerCase().includes(queryLower) ||
                        t.specialties?.some(s => s.toLowerCase().includes(queryLower))
                )
            }

            setTherapists(sorted as Therapist[])
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحميل الأخصائيين')
        } finally {
            setLoading(false)
        }
    }, [selectedSpecialties, sortBy, searchQuery])

    useEffect(() => {
        fetchTherapists()
    }, [fetchTherapists])

    const toggleSpecialty = (specialty: string) => {
        setSelectedSpecialties(prev =>
            prev.includes(specialty) ? prev.filter(s => s !== specialty) : [...prev, specialty]
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center mb-3">
                    <TextInput
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-right"
                        placeholder="ابحث عن أخصائي..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={fetchTherapists}
                    />
                    <Pressable
                        onPress={() => setShowFilters(!showFilters)}
                        className="mr-3 p-2"
                    >
                        <Ionicons name="filter" size={24} color={showFilters ? '#3b82f6' : 'gray'} />
                    </Pressable>
                </View>

                {/* Filters */}
                {showFilters && (
                    <View className="border-t border-gray-200 pt-3">
                        <Text className="text-sm font-semibold mb-2 text-right">التخصصات</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                            <View className="flex-row">
                                {SPECIALTIES.map(spec => (
                                    <Pressable
                                        key={spec}
                                        onPress={() => toggleSpecialty(spec)}
                                        className={`px-3 py-1 mr-2 rounded-full border ${
                                            selectedSpecialties.includes(spec)
                                                ? 'bg-blue-500 border-blue-700'
                                                : 'bg-gray-100 border-gray-300'
                                        }`}
                                    >
                                        <Text
                                            className={
                                                selectedSpecialties.includes(spec)
                                                    ? 'text-white text-xs'
                                                    : 'text-gray-700 text-xs'
                                            }
                                        >
                                            {spec}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>

                        <Text className="text-sm font-semibold mb-2 text-right">ترتيب حسب</Text>
                        <View className="flex-row">
                            {[
                                { key: 'rate', label: 'السعر' },
                                { key: 'experience', label: 'الخبرة' },
                                { key: 'name', label: 'الاسم' },
                            ].map(option => (
                                <Pressable
                                    key={option.key}
                                    onPress={() => setSortBy(option.key as any)}
                                    className={`px-4 py-2 mr-2 rounded-lg ${
                                        sortBy === option.key ? 'bg-blue-500' : 'bg-gray-200'
                                    }`}
                                >
                                    <Text
                                        className={sortBy === option.key ? 'text-white' : 'text-gray-700'}
                                    >
                                        {option.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {/* Results */}
            <ScrollView className="flex-1 p-4">
                {loading ? (
                    <>
                        {[1, 2, 3].map(i => (
                            <TherapistSkeleton key={i} />
                        ))}
                    </>
                ) : therapists.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="search-outline" size={64} color="gray" />
                        <Text className="text-gray-500 text-lg mt-4">لم يتم العثور على أخصائيين</Text>
                    </View>
                ) : (
                    therapists.map(therapist => (
                        <TherapistCard
                            key={therapist.id}
                            therapist={therapist}
                            onPress={() => setSelectedTherapist(therapist)}
                        />
                    ))
                )}
            </ScrollView>

            {/* Therapist Detail Modal */}
            <Modal
                visible={selectedTherapist !== null}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedTherapist(null)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
                        {selectedTherapist && (
                            <>
                                <View className="flex-row justify-between items-center mb-4">
                                    <Pressable onPress={() => setSelectedTherapist(null)}>
                                        <Ionicons name="close" size={28} color="gray" />
                                    </Pressable>
                                    <Text className="text-xl font-bold text-right">معلومات الأخصائي</Text>
                                </View>

                                <ScrollView>
                                    <View className="items-center mb-4">
                                        {selectedTherapist.avatar_url ? (
                                            <Image
                                                source={{ uri: selectedTherapist.avatar_url }}
                                                className="w-24 h-24 rounded-full"
                                            />
                                        ) : (
                                            <View className="w-24 h-24 rounded-full bg-gray-300 items-center justify-center">
                                                <Ionicons name="person" size={48} color="gray" />
                                            </View>
                                        )}
                                        <View className="flex-row items-center mt-2">
                                            <Text className="text-2xl font-bold text-right">
                                                {selectedTherapist.full_name}
                                            </Text>
                                            {selectedTherapist.is_verified && (
                                                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                                            )}
                                        </View>
                                    </View>

                                    {selectedTherapist.specialties && selectedTherapist.specialties.length > 0 && (
                                        <View className="mb-4">
                                            <Text className="text-lg font-semibold mb-2 text-right">التخصصات</Text>
                                            <View className="flex-row flex-wrap">
                                                {selectedTherapist.specialties.map((spec, idx) => (
                                                    <View
                                                        key={idx}
                                                        className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2"
                                                    >
                                                        <Text className="text-blue-700">{spec}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {selectedTherapist.bio && (
                                        <View className="mb-4">
                                            <Text className="text-lg font-semibold mb-2 text-right">نبذة</Text>
                                            <Text className="text-gray-700 text-right leading-6">
                                                {selectedTherapist.bio}
                                            </Text>
                                        </View>
                                    )}

                                    <View className="flex-row justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                                        <View>
                                            <Text className="text-sm text-gray-600 text-right">سنوات الخبرة</Text>
                                            <Text className="text-lg font-bold text-right">
                                                {selectedTherapist.years_of_experience}
                                            </Text>
                                        </View>
                                        {selectedTherapist.rate && (
                                            <View>
                                                <Text className="text-sm text-gray-600 text-right">السعر</Text>
                                                <Text className="text-lg font-bold text-green-600 text-right">
                                                    {selectedTherapist.rate} د.أ
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {selectedTherapist.license_number && (
                                        <View className="mb-4">
                                            <Text className="text-sm text-gray-600 text-right">
                                                رقم الرخصة: {selectedTherapist.license_number}
                                            </Text>
                                        </View>
                                    )}

                                    <View className="flex-row gap-2 mt-4">
                                        <Pressable
                                            onPress={async () => {
                                                const { data: { user } } = await supabase.auth.getUser()
                                                if (!user) {
                                                    Alert.alert('تنبيه', 'يرجى تسجيل الدخول أولاً')
                                                    router.push('/(root)/Screens/login')
                                                    return
                                                }

                                                // Check if therapist is verified
                                                if (!selectedTherapist.is_verified) {
                                                    Alert.alert('تنبيه', 'لا يمكن بدء محادثة مع أخصائي غير متحقق')
                                                    return
                                                }

                                                // Check if there's a confirmed appointment
                                                const { data: confirmedAppointment } = await supabase
                                                    .from('appointments')
                                                    .select('id')
                                                    .eq('patient_id', user.id)
                                                    .eq('therapist_id', selectedTherapist.id)
                                                    .eq('status', 'confirmed')
                                                    .maybeSingle()

                                                if (!confirmedAppointment) {
                                                    Alert.alert(
                                                        'تنبيه',
                                                        'يجب أن يكون لديك موعد مؤكد مع هذا الأخصائي قبل بدء المحادثة. يرجى حجز موعد أولاً.'
                                                    )
                                                    return
                                                }

                                                // Check if room exists
                                                const { data: existingRoom } = await supabase
                                                    .from('chat_rooms')
                                                    .select('id')
                                                    .eq('patient_id', user.id)
                                                    .eq('therapist_id', selectedTherapist.id)
                                                    .maybeSingle()

                                                if (existingRoom) {
                                                    setSelectedTherapist(null)
                                                    router.push(`/(root)/Screens/chat?roomId=${existingRoom.id}`)
                                                } else {
                                                    // Create new room
                                                    const { data: newRoom, error } = await supabase
                                                        .from('chat_rooms')
                                                        .insert({
                                                            patient_id: user.id,
                                                            therapist_id: selectedTherapist.id,
                                                        })
                                                        .select('id')
                                                        .single()

                                                    if (error) {
                                                        Alert.alert('خطأ', error.message || 'فشل إنشاء المحادثة')
                                                    } else {
                                                        setSelectedTherapist(null)
                                                        router.push(`/(root)/Screens/chat?roomId=${newRoom.id}`)
                                                    }
                                                }
                                            }}
                                            className="flex-1 bg-purple-500 p-4 rounded-lg"
                                        >
                                            <Text className="text-white text-center font-bold">
                                                محادثة
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => {
                                                setSelectedTherapist(null)
                                                router.push(`/(root)/Screens/appointments?therapistId=${selectedTherapist.id}`)
                                            }}
                                            className="flex-1 bg-blue-500 p-4 rounded-lg"
                                        >
                                            <Text className="text-white text-center font-bold">
                                                حجز موعد
                                            </Text>
                                        </Pressable>
                                    </View>
                                    <Pressable
                                        onPress={() => {
                                            setSelectedTherapist(null)
                                            router.push(`/(root)/Screens/rating?therapistId=${selectedTherapist.id}`)
                                        }}
                                        className="bg-yellow-500 p-4 rounded-lg mt-2"
                                    >
                                        <Text className="text-white text-center font-bold">
                                            عرض التقييمات
                                        </Text>
                                    </Pressable>
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

