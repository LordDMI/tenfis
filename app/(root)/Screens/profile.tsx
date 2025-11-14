import React, { useState, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    SafeAreaView,
} from 'react-native'
import { supabase } from '@/utils/supabaseClient'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { uploadProfilePicture } from '@/utils/uploadProfilePicture'

interface Profile {
    id: string
    full_name: string
    email: string
    phone: string
    dob: string | null
    place_of_birth: string | null
    current_address: string | null
    allergies: string | null
    avatar_url: string | null
    role: string
    specialties: string[] | null
    bio: string | null
    rate: number | null
    is_verified: boolean
    license_number: string | null
    years_of_experience: number | null
}

interface Post {
    id: string
    user_id: string
    content: string
    image_url: string | null
    created_at: string
    likes_count: number
    comments_count: number
    is_liked: boolean
}

export default function ProfileScreen() {
    const { userId } = useLocalSearchParams<{ userId?: string }>()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editing, setEditing] = useState(false)
    const [showImagePicker, setShowImagePicker] = useState(false)
    const [posts, setPosts] = useState<Post[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isOwnProfile, setIsOwnProfile] = useState(true)
    const [comments, setComments] = useState<Record<string, any[]>>({})
    const [showComments, setShowComments] = useState<Record<string, boolean>>({})
    const [newComment, setNewComment] = useState('')
    const [postingComment, setPostingComment] = useState<string | null>(null)
    const router = useRouter()

    // Edit form state
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [bio, setBio] = useState('')
    const [allergies, setAllergies] = useState('')
    const [currentAddress, setCurrentAddress] = useState('')
    const [rate, setRate] = useState('')

    const getCurrentUserId = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)
        setIsOwnProfile(!userId || userId === user?.id)
    }, [userId])

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user && !userId) {
                router.replace('../login')
                return
            }

            const targetUserId = userId || user?.id
            if (!targetUserId) return

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUserId)
                .maybeSingle()

            if (error) {
                console.error('Profile fetch error:', error)
                throw error
            }

            if (!data) {
                Alert.alert('تنبيه', 'الملف الشخصي غير موجود.')
                if (!userId) router.replace('../login')
                return
            }

            setProfile(data as Profile)
            setFullName(data.full_name || '')
            setPhone(data.phone || '')
            setBio(data.bio || '')
            setAllergies(data.allergies || '')
            setCurrentAddress(data.current_address || '')
            setRate(data.rate?.toString() || '')
        } catch (error: any) {
            console.error('Profile error:', error)
            Alert.alert('خطأ', error.message || 'فشل تحميل الملف الشخصي')
        } finally {
            setLoading(false)
        }
    }, [userId, router])

    const fetchPosts = useCallback(async (targetUserId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('posts')
                .select('id, user_id, content, image_url, created_at')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) throw error

            // Get post IDs
            const postIds = data?.map(p => p.id) || []

            // Get likes count and user likes
            const { data: allLikes } = await supabase
                .from('likes')
                .select('post_id, user_id')
                .in('post_id', postIds)

            // Get comments count
            const { data: allComments } = await supabase
                .from('comments')
                .select('post_id')
                .in('post_id', postIds)

            // Count likes and comments per post
            const likesCount: Record<string, number> = {}
            const commentsCount: Record<string, number> = {}
            const likedPostIds = new Set<string>()

            allLikes?.forEach(like => {
                likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1
                if (like.user_id === user.id) {
                    likedPostIds.add(like.post_id)
                }
            })

            allComments?.forEach(comment => {
                commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1
            })

            const formattedPosts: Post[] = (data || []).map((post: any) => ({
                ...post,
                likes_count: likesCount[post.id] || 0,
                comments_count: commentsCount[post.id] || 0,
                is_liked: likedPostIds.has(post.id),
            }))

            setPosts(formattedPosts)
        } catch (error: any) {
            console.error('Error fetching posts:', error)
        }
    }, [])

    useEffect(() => {
        getCurrentUserId()
    }, [userId, getCurrentUserId])

    useEffect(() => {
        if (currentUserId || userId) {
            fetchProfile()
            fetchPosts(userId || currentUserId || '')
        }
    }, [currentUserId, userId, fetchProfile, fetchPosts])

    const toggleLike = async (postId: string, currentlyLiked: boolean) => {
        if (!currentUserId) return

        // Optimistic update
        setPosts(prev =>
            prev.map(post =>
                post.id === postId
                    ? {
                          ...post,
                          is_liked: !currentlyLiked,
                          likes_count: currentlyLiked ? post.likes_count - 1 : post.likes_count + 1,
                      }
                    : post
            )
        )

        try {
            if (currentlyLiked) {
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', currentUserId)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('likes')
                    .insert({ post_id: postId, user_id: currentUserId })

                if (error) throw error
            }
        } catch (error: any) {
            // Revert on error
            setPosts(prev =>
                prev.map(post =>
                    post.id === postId
                        ? {
                              ...post,
                              is_liked: currentlyLiked,
                              likes_count: currentlyLiked ? post.likes_count + 1 : post.likes_count - 1,
                          }
                        : post
                )
            )
            Alert.alert('خطأ', error.message || 'فشل تحديث الإعجاب')
        }
    }

    const fetchComments = async (postId: string) => {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true })

            if (error) throw error

            setComments(prev => ({ ...prev, [postId]: data || [] }))
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحميل التعليقات')
        }
    }

    const handleAddComment = async (postId: string) => {
        if (!newComment.trim() || !currentUserId) return

        const commentContent = newComment.trim()
        setNewComment('')
        setPostingComment(postId)

        // Optimistic update
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', currentUserId)
            .maybeSingle()

        const optimisticComment = {
            id: `temp-${Date.now()}`,
            post_id: postId,
            user_id: currentUserId,
            content: commentContent,
            created_at: new Date().toISOString(),
            profiles: profile || { id: currentUserId, full_name: 'أنت', avatar_url: null },
        }

        setComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), optimisticComment],
        }))

        setPosts(prev =>
            prev.map(post =>
                post.id === postId ? { ...post, comments_count: post.comments_count + 1 } : post
            )
        )

        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: currentUserId,
                    content: commentContent,
                })
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .single()

            if (error) throw error

            // Replace optimistic comment with real one
            setComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []).filter((c: any) => !c.id.startsWith('temp')), data],
            }))
        } catch (error: any) {
            // Revert on error
            setComments(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).filter((c: any) => !c.id.startsWith('temp')),
            }))
            setPosts(prev =>
                prev.map(post =>
                    post.id === postId ? { ...post, comments_count: post.comments_count - 1 } : post
                )
            )
            Alert.alert('خطأ', error.message || 'فشل إضافة التعليق')
        } finally {
            setPostingComment(null)
        }
    }

    const toggleComments = (postId: string) => {
        const isOpen = showComments[postId]
        setShowComments(prev => ({ ...prev, [postId]: !isOpen }))
        if (!isOpen && !comments[postId]) {
            fetchComments(postId)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (minutes < 1) return 'الآن'
        if (minutes < 60) return `منذ ${minutes} دقيقة`
        if (hours < 24) return `منذ ${hours} ساعة`
        if (days < 7) return `منذ ${days} يوم`
        return date.toLocaleDateString('ar-SA')
    }

    const handleEdit = () => {
        // Check if psychologue is verified
        if (profile?.role === 'psychologue' && !profile?.is_verified) {
            Alert.alert(
                'حساب قيد المراجعة',
                'يجب أن يتم التحقق من حسابك من قبل الإدارة أولاً قبل تعديل الملف الشخصي.'
            )
            return
        }
        setEditing(true)
    }

    const handleCancel = () => {
        if (profile) {
            setFullName(profile.full_name || '')
            setPhone(profile.phone || '')
            setBio(profile.bio || '')
            setAllergies(profile.allergies || '')
            setCurrentAddress(profile.current_address || '')
            setRate(profile.rate?.toString() || '')
        }
        setEditing(false)
    }

    const handleSave = async () => {
        if (!profile) return

        setSaving(true)
        try {
            const updateData: any = {
                full_name: fullName.trim(),
                phone: phone.trim(),
            }

            if (profile.role === 'patient') {
                updateData.allergies = allergies.trim() || null
                updateData.current_address = currentAddress.trim() || null
            } else {
                updateData.bio = bio.trim() || null
                if (rate.trim()) {
                    updateData.rate = parseFloat(rate.trim())
                }
            }

            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', profile.id)
                .select()
                .maybeSingle()

            if (error) {
                console.error('Profile update error:', error)
                throw error
            }

            if (data) {
                setProfile(data as Profile)
            }
            setEditing(false)
            Alert.alert('نجح', 'تم تحديث الملف الشخصي بنجاح')
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحديث الملف الشخصي')
        } finally {
            setSaving(false)
        }
    }

    const handleChangeAvatar = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })

            if (result.canceled || !profile) return

            const asset = result.assets?.[0]
            if (!asset) return

            setSaving(true)

            const imageUrl = await uploadProfilePicture(
                asset.uri,
                asset.mimeType || 'image/jpeg',
                asset.uri.split('/').pop() || 'avatar.jpg',
                profile.id
            )

            if (imageUrl) {
                const { data, error } = await supabase
                    .from('profiles')
                    .update({ avatar_url: imageUrl })
                    .eq('id', profile.id)
                    .select()
                    .maybeSingle()

                if (error) {
                    console.error('Avatar update error:', error)
                    throw error
                }

                if (data) {
                    setProfile({ ...profile, avatar_url: imageUrl })
                    Alert.alert('نجح', 'تم تحديث الصورة الشخصية بنجاح')
                }
            }
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحديث الصورة')
        } finally {
            setSaving(false)
            setShowImagePicker(false)
        }
    }

    const handleSignOut = async () => {
        Alert.alert(
            'تأكيد',
            'هل أنت متأكد من تسجيل الخروج؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'تسجيل الخروج',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut()
                        router.replace('../login')
                    },
                },
            ]
        )
    }

    const formatProfileDate = (dateString: string | null) => {
        if (!dateString) return 'غير محدد'
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

    if (!profile) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text className="text-gray-500">فشل تحميل الملف الشخصي</Text>
            </View>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-right">الملف الشخصي</Text>
                {!editing && isOwnProfile && !(profile.role === 'psychologue' && !profile.is_verified) && (
                    <Pressable onPress={handleEdit} className="p-2">
                        <Ionicons name="create-outline" size={24} color="#3b82f6" />
                    </Pressable>
                )}
            </View>

            <ScrollView className="flex-1">
                {/* Avatar Section */}
                <View className="items-center py-6 bg-white border-b border-gray-200">
                    <Pressable
                        onPress={() => editing && setShowImagePicker(true)}
                        disabled={!editing}
                    >
                        {profile.avatar_url ? (
                            <Image
                                source={{ uri: profile.avatar_url }}
                                className="w-32 h-32 rounded-full border-4 border-blue-500"
                            />
                        ) : (
                            <View className="w-32 h-32 rounded-full bg-gray-300 items-center justify-center border-4 border-blue-500">
                                <Ionicons name="person" size={64} color="gray" />
                            </View>
                        )}
                    </Pressable>
                    {editing && (
                        <Pressable
                            onPress={() => setShowImagePicker(true)}
                            className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
                        >
                            <Text className="text-white font-semibold">تغيير الصورة</Text>
                        </Pressable>
                    )}
                    {profile.is_verified && profile.role === 'psychologue' && (
                        <View className="flex-row items-center mt-2">
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                            <Text className="mr-2 text-green-600 font-semibold">متحقق</Text>
                        </View>
                    )}
                </View>

                {/* Profile Information */}
                <View className="bg-white mt-4 p-4">
                    <View className="mb-4">
                        <Text className="text-gray-600 text-sm mb-2 text-right">الاسم الكامل</Text>
                        {editing ? (
                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 text-right"
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="الاسم الكامل"
                            />
                        ) : (
                            <Text className="text-lg font-semibold text-right">{profile.full_name || 'غير محدد'}</Text>
                        )}
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-600 text-sm mb-2 text-right">البريد الإلكتروني</Text>
                        <Text className="text-lg text-right">{profile.email}</Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-600 text-sm mb-2 text-right">رقم الهاتف</Text>
                        {editing ? (
                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 text-right"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="رقم الهاتف"
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text className="text-lg text-right">{profile.phone || 'غير محدد'}</Text>
                        )}
                    </View>

                    {profile.dob && (
                        <View className="mb-4">
                            <Text className="text-gray-600 text-sm mb-2 text-right">تاريخ الميلاد</Text>
                            <Text className="text-lg text-right">{formatProfileDate(profile.dob)}</Text>
                        </View>
                    )}

                    {profile.place_of_birth && (
                        <View className="mb-4">
                            <Text className="text-gray-600 text-sm mb-2 text-right">مكان الميلاد</Text>
                            <Text className="text-lg text-right">{profile.place_of_birth}</Text>
                        </View>
                    )}

                    {profile.role === 'patient' && (
                        <>
                            <View className="mb-4">
                                <Text className="text-gray-600 text-sm mb-2 text-right">العنوان الحالي</Text>
                                {editing ? (
                                    <TextInput
                                        className="border border-gray-300 rounded-lg p-3 text-right"
                                        value={currentAddress}
                                        onChangeText={setCurrentAddress}
                                        placeholder="العنوان الحالي"
                                        multiline
                                    />
                                ) : (
                                    <Text className="text-lg text-right">{profile.current_address || 'غير محدد'}</Text>
                                )}
                            </View>

                            <View className="mb-4">
                                <Text className="text-gray-600 text-sm mb-2 text-right">الحساسية أو الأمراض</Text>
                                {editing ? (
                                    <TextInput
                                        className="border border-gray-300 rounded-lg p-3 h-24 text-right"
                                        value={allergies}
                                        onChangeText={setAllergies}
                                        placeholder="الحساسية أو الأمراض"
                                        multiline
                                    />
                                ) : (
                                    <Text className="text-lg text-right">{profile.allergies || 'لا يوجد'}</Text>
                                )}
                            </View>
                        </>
                    )}

                    {profile.role === 'psychologue' && (
                        <>
                            {profile.specialties && profile.specialties.length > 0 && (
                                <View className="mb-4">
                                    <Text className="text-gray-600 text-sm mb-2 text-right">التخصصات</Text>
                                    <View className="flex-row flex-wrap">
                                        {profile.specialties.map((spec, idx) => (
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

                            <View className="mb-4">
                                <Text className="text-gray-600 text-sm mb-2 text-right">نبذة</Text>
                                {editing ? (
                                    <TextInput
                                        className="border border-gray-300 rounded-lg p-3 h-24 text-right"
                                        value={bio}
                                        onChangeText={setBio}
                                        placeholder="نبذة عنك"
                                        multiline
                                    />
                                ) : (
                                    <Text className="text-lg text-right">{profile.bio || 'غير محدد'}</Text>
                                )}
                            </View>

                            {profile.rate && (
                                <View className="mb-4">
                                    <Text className="text-gray-600 text-sm mb-2 text-right">السعر (بالدينار)</Text>
                                    {editing ? (
                                        <TextInput
                                            className="border border-gray-300 rounded-lg p-3 text-right"
                                            value={rate}
                                            onChangeText={setRate}
                                            placeholder="السعر"
                                            keyboardType="numeric"
                                        />
                                    ) : (
                                        <Text className="text-lg font-bold text-green-600 text-right">
                                            {profile.rate} د.أ
                                        </Text>
                                    )}
                                </View>
                            )}

                            {profile.years_of_experience && (
                                <View className="mb-4">
                                    <Text className="text-gray-600 text-sm mb-2 text-right">سنوات الخبرة</Text>
                                    <Text className="text-lg text-right">{profile.years_of_experience} سنة</Text>
                                </View>
                            )}

                            {profile.license_number && (
                                <View className="mb-4">
                                    <Text className="text-gray-600 text-sm mb-2 text-right">رقم الرخصة</Text>
                                    <Text className="text-lg text-right">{profile.license_number}</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Posts Section */}
                <View className="bg-white mt-4 p-4">
                    <Text className="text-xl font-bold mb-4 text-right">المنشورات</Text>
                    {posts.length === 0 ? (
                        <Text className="text-gray-500 text-center py-8">لا توجد منشورات</Text>
                    ) : (
                        <View>
                            {posts.map(post => (
                                <View key={post.id} className="mb-4 pb-4 border-b border-gray-200">
                                    {post.content && (
                                        <Text className="text-right mb-2 leading-6">{post.content}</Text>
                                    )}
                                    {post.image_url && (
                                        <Image source={{ uri: post.image_url }} className="w-full h-48 rounded-lg mb-2" />
                                    )}
                                    <Text className="text-gray-400 text-xs text-right mb-3">
                                        {formatDate(post.created_at)}
                                    </Text>

                                    {/* Like and Comment Actions */}
                                    <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                                        <Pressable
                                            onPress={() => toggleLike(post.id, post.is_liked)}
                                            className="flex-row items-center"
                                        >
                                            <Ionicons
                                                name={post.is_liked ? 'heart' : 'heart-outline'}
                                                size={24}
                                                color={post.is_liked ? 'red' : 'gray'}
                                            />
                                            <Text className="mr-2 text-gray-600">{post.likes_count}</Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => toggleComments(post.id)}
                                            className="flex-row items-center"
                                        >
                                            <Ionicons name="chatbubble-outline" size={24} color="gray" />
                                            <Text className="mr-2 text-gray-600">{post.comments_count}</Text>
                                        </Pressable>
                                    </View>

                                    {/* Comments Section */}
                                    {showComments[post.id] && (
                                        <View className="mt-4 pt-4 border-t border-gray-100">
                                            {comments[post.id]?.map((comment: any) => (
                                                <View key={comment.id} className="mb-3 flex-row">
                                                    {comment.profiles?.avatar_url ? (
                                                        <Image
                                                            source={{ uri: comment.profiles.avatar_url }}
                                                            className="w-8 h-8 rounded-full"
                                                        />
                                                    ) : (
                                                        <View className="w-8 h-8 rounded-full bg-gray-300" />
                                                    )}
                                                    <View className="mr-2 flex-1 bg-gray-100 rounded-lg p-2">
                                                        <Text className="font-semibold text-xs text-right mb-1">
                                                            {comment.profiles?.full_name || 'مستخدم'}
                                                        </Text>
                                                        <Text className="text-right text-sm">{comment.content}</Text>
                                                    </View>
                                                </View>
                                            ))}

                                            <View className="flex-row items-center mt-2">
                                                <TextInput
                                                    className="flex-1 border border-gray-300 rounded-lg p-2 text-right"
                                                    placeholder="اكتب تعليقاً..."
                                                    value={newComment}
                                                    onChangeText={setNewComment}
                                                    onSubmitEditing={() => handleAddComment(post.id)}
                                                />
                                                <Pressable
                                                    onPress={() => handleAddComment(post.id)}
                                                    disabled={postingComment === post.id}
                                                    className="mr-2"
                                                >
                                                    {postingComment === post.id ? (
                                                        <ActivityIndicator size="small" />
                                                    ) : (
                                                        <Ionicons name="send" size={24} color="blue" />
                                                    )}
                                                </Pressable>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                {editing ? (
                    <View className="p-4 bg-white mt-4">
                        <View className="flex-row gap-2">
                            <Pressable
                                onPress={handleCancel}
                                className="flex-1 bg-gray-400 p-4 rounded-lg"
                                disabled={saving}
                            >
                                <Text className="text-white text-center font-bold">إلغاء</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleSave}
                                className="flex-1 bg-blue-500 p-4 rounded-lg"
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-center font-bold">حفظ</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                ) : isOwnProfile ? (
                    <View className="p-4 bg-white mt-4">
                        <Pressable
                            onPress={handleSignOut}
                            className="bg-red-500 p-4 rounded-lg"
                        >
                            <Text className="text-white text-center font-bold">تسجيل الخروج</Text>
                        </Pressable>
                    </View>
                ) : null}
            </ScrollView>

            {/* Image Picker Modal */}
            <Modal
                visible={showImagePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowImagePicker(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-right">تغيير الصورة الشخصية</Text>
                            <Pressable onPress={() => setShowImagePicker(false)}>
                                <Ionicons name="close" size={28} color="gray" />
                            </Pressable>
                        </View>
                        <Pressable
                            onPress={handleChangeAvatar}
                            className="bg-blue-500 p-4 rounded-lg"
                        >
                            <Text className="text-white text-center font-bold">اختيار صورة</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

