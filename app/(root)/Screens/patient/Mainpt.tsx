import { View, Text, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function Mainpt() {
    const router = useRouter()

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-6 border-b border-gray-200">
                <Text className="text-2xl font-bold text-right">مرحباً</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                <Pressable
                    onPress={() => router.push('../feed')}
                    className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                >
                    <Ionicons name="newspaper-outline" size={28} color="#3b82f6" />
                    <View className="mr-4 flex-1">
                        <Text className="text-lg font-bold text-right">المنشورات</Text>
                        <Text className="text-gray-600 text-sm text-right">تصفح وشارك المنشورات</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </Pressable>

                <Pressable
                    onPress={() => router.push('../search')}
                    className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                >
                    <Ionicons name="search-outline" size={28} color="#10b981" />
                    <View className="mr-4 flex-1">
                        <Text className="text-lg font-bold text-right">البحث عن أخصائي</Text>
                        <Text className="text-gray-600 text-sm text-right">ابحث واحجز مع أخصائي</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </Pressable>

                <Pressable
                    onPress={() => router.push('../appointments')}
                    className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                >
                    <Ionicons name="calendar-outline" size={28} color="#f59e0b" />
                    <View className="mr-4 flex-1">
                        <Text className="text-lg font-bold text-right">المواعيد</Text>
                        <Text className="text-gray-600 text-sm text-right">إدارة مواعيدك</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </Pressable>

                <Pressable
                    onPress={() => router.push('../chat')}
                    className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                >
                    <Ionicons name="chatbubbles-outline" size={28} color="#8b5cf6" />
                    <View className="mr-4 flex-1">
                        <Text className="text-lg font-bold text-right">المحادثات</Text>
                        <Text className="text-gray-600 text-sm text-right">تواصل مع أخصائيك</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </Pressable>

                <Pressable
                    onPress={() => router.push('../profile')}
                    className="bg-white rounded-xl p-4 mb-4 border border-gray-200 flex-row items-center active:opacity-70"
                >
                    <Ionicons name="person-outline" size={28} color="#6366f1" />
                    <View className="mr-4 flex-1">
                        <Text className="text-lg font-bold text-right">الملف الشخصي</Text>
                        <Text className="text-gray-600 text-sm text-right">عرض وتعديل ملفك الشخصي</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </Pressable>
            </ScrollView>
        </View>
    )
}
