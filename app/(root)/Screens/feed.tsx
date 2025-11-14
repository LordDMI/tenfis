import React, { useState, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    TextInput,
    Pressable,
    Image,
    ScrollView,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native'
import { supabase } from '@/utils/supabaseClient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { uploadProfilePicture } from '@/utils/uploadProfilePicture'

interface Post {
    id: string
    user_id: string
    content: string
    image_url: string | null
    created_at: string
    profiles: {
        id: string
        full_name: string
        avatar_url: string | null
        role: string
        is_verified?: boolean
    }
    likes_count: number
    comments_count: number
    is_liked: boolean
}

interface Comment {
    id: string
    post_id: string
    user_id: string
    content: string
    created_at: string
    profiles: {
        id: string
        full_name: string
        avatar_url: string | null
    }
}

const PostSkeleton = () => (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
        <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 bg-gray-300 rounded-full" />
            <View className="mr-3 flex-1">
                <View className="h-4 bg-gray-300 rounded w-24 mb-2" />
                <View className="h-3 bg-gray-200 rounded w-16" />
            </View>
        </View>
        <View className="h-4 bg-gray-200 rounded w-full mb-2" />
        <View className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
        <View className="h-48 bg-gray-200 rounded-xl mb-3" />
        <View className="flex-row justify-between">
            <View className="h-6 bg-gray-200 rounded w-16" />
            <View className="h-6 bg-gray-200 rounded w-16" />
        </View>
    </View>
)

export default function Feed() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [currentUser, setCurrentUser] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newPostContent, setNewPostContent] = useState('')
    const [newPostImage, setNewPostImage] = useState<string | null>(null)
    const [newPostImageType, setNewPostImageType] = useState('')
    const [newPostImageName, setNewPostImageName] = useState('')
    const [creatingPost, setCreatingPost] = useState(false)
    const [comments, setComments] = useState<Record<string, Comment[]>>({})
    const [showComments, setShowComments] = useState<Record<string, boolean>>({})
    const [newComment, setNewComment] = useState('')
    const [postingComment, setPostingComment] = useState<string | null>(null)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [editingPost, setEditingPost] = useState<string | null>(null)
    const [editPostContent, setEditPostContent] = useState('')
    const router = useRouter()

    useEffect(() => {
        getCurrentUser()
        fetchUserProfile()
        fetchPosts()
    }, [])

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user?.id || null)
    }

    const fetchUserProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('role, is_verified')
                .eq('id', user.id)
                .maybeSingle()

            setUserProfile(data)
        } catch (error) {
            console.error('Error fetching user profile:', error)
        }
    }

    const fetchPosts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url,
                        role,
                        is_verified
                    )
                `)
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
            Alert.alert('خطأ', error.message || 'فشل تحميل المنشورات')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        fetchPosts()
    }, [])

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        })

        if (!result.canceled) {
            const asset = result.assets?.[0]
            setNewPostImage(asset?.uri || null)
            setNewPostImageType(asset?.mimeType || 'image/jpeg')
            setNewPostImageName(asset?.uri.split('/').pop() || 'post.jpg')
        }
    }

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !newPostImage) {
            Alert.alert('تنبيه', 'يرجى إدخال محتوى أو صورة')
            return
        }

        if (!currentUser) return

        // Check if psychologue is verified
        if (userProfile?.role === 'psychologue' && !userProfile?.is_verified) {
            Alert.alert('تنبيه', 'يجب التحقق من حسابك أولاً قبل إنشاء المنشورات')
            return
        }

        setCreatingPost(true)
        try {
            let imageUrl: string | null = null
            if (newPostImage && newPostImageType && newPostImageName) {
                imageUrl = await uploadProfilePicture(newPostImage, newPostImageType, newPostImageName, currentUser)
            }

            const { data, error } = await supabase
                .from('posts')
                .insert({
                    user_id: currentUser,
                    content: newPostContent.trim(),
                    image_url: imageUrl,
                })
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url,
                        role,
                        is_verified
                    )
                `)
                .single()

            if (error) throw error

            // Optimistic update
            const newPost: Post = {
                ...data,
                likes_count: 0,
                comments_count: 0,
                is_liked: false,
            }

            setPosts(prev => [newPost, ...prev])
            setShowCreateModal(false)
            setNewPostContent('')
            setNewPostImage(null)
            setNewPostImageType('')
            setNewPostImageName('')
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل إنشاء المنشور')
        } finally {
            setCreatingPost(false)
        }
    }

    const toggleLike = async (postId: string, currentlyLiked: boolean) => {
        if (!currentUser) return

        // Check if psychologue is verified
        if (userProfile?.role === 'psychologue' && !userProfile?.is_verified) {
            Alert.alert(
                'حساب قيد المراجعة',
                'يجب أن يتم التحقق من حسابك من قبل الإدارة أولاً قبل الوصول إلى هذه الميزة.'
            )
            return
        }

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
                    .eq('user_id', currentUser)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('likes')
                    .insert({ post_id: postId, user_id: currentUser })

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
        if (!newComment.trim() || !currentUser) return

        // Check if psychologue is verified
        if (userProfile?.role === 'psychologue' && !userProfile?.is_verified) {
            Alert.alert(
                'حساب قيد المراجعة',
                'يجب أن يتم التحقق من حسابك من قبل الإدارة أولاً قبل الوصول إلى هذه الميزة.'
            )
            return
        }

        const commentContent = newComment.trim()
        setNewComment('')
        setPostingComment(postId)

        // Optimistic update
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', currentUser)
            .single()

        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            post_id: postId,
            user_id: currentUser,
            content: commentContent,
            created_at: new Date().toISOString(),
            profiles: profile || { id: currentUser, full_name: 'أنت', avatar_url: null },
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
                    user_id: currentUser,
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
                [postId]: [...(prev[postId] || []).filter(c => !c.id.startsWith('temp')), data],
            }))
        } catch (error: any) {
            // Revert on error
            setComments(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).filter(c => !c.id.startsWith('temp')),
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

    const handleEditPost = async (postId: string) => {
        if (!editPostContent.trim()) {
            Alert.alert('تنبيه', 'يرجى إدخال محتوى')
            return
        }

        // Check if psychologue is verified
        if (userProfile?.role === 'psychologue' && !userProfile?.is_verified) {
            Alert.alert(
                'حساب قيد المراجعة',
                'يجب أن يتم التحقق من حسابك من قبل الإدارة أولاً قبل الوصول إلى هذه الميزة.'
            )
            return
        }

        try {
            const { error } = await supabase
                .from('posts')
                .update({ content: editPostContent.trim() })
                .eq('id', postId)

            if (error) throw error

            setPosts(prev =>
                prev.map(post =>
                    post.id === postId ? { ...post, content: editPostContent.trim() } : post
                )
            )
            setEditingPost(null)
            setEditPostContent('')
            Alert.alert('نجح', 'تم تحديث المنشور بنجاح')
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحديث المنشور')
        }
    }

    const handleDeletePost = async (postId: string) => {
        // Check if psychologue is verified
        if (userProfile?.role === 'psychologue' && !userProfile?.is_verified) {
            Alert.alert(
                'حساب قيد المراجعة',
                'يجب أن يتم التحقق من حسابك من قبل الإدارة أولاً قبل الوصول إلى هذه الميزة.'
            )
            return
        }

        const isAdmin = userProfile?.role === 'admin'
        const post = posts.find(p => p.id === postId)
        const isOwnPost = currentUser === post?.user_id
        
        Alert.alert(
            'تأكيد',
            isAdmin && !isOwnPost 
                ? 'هل أنت متأكد من حذف هذا المنشور كمسؤول؟'
                : 'هل أنت متأكد من حذف هذا المنشور؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('posts').delete().eq('id', postId)

                            if (error) throw error

                            setPosts(prev => prev.filter(post => post.id !== postId))
                            Alert.alert('نجح', 'تم حذف المنشور بنجاح')
                        } catch (error: any) {
                            Alert.alert('خطأ', error.message || 'فشل حذف المنشور')
                        }
                    },
                },
            ]
        )
    }

    const navigateToProfile = (userId: string) => {
        router.push(`/(root)/Screens/profile?userId=${userId}`)
    }

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 p-4">
                {[1, 2, 3].map(i => (
                    <PostSkeleton key={i} />
                ))}
            </View>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-right">المنشورات</Text>
                <Pressable
                    onPress={() => {
                        if (userProfile?.role === 'psychologue' && !userProfile?.is_verified) {
                            Alert.alert(
                                'حساب قيد المراجعة',
                                'يجب أن يتم التحقق من حسابك من قبل الإدارة أولاً قبل إنشاء المنشورات.'
                            )
                        } else {
                            setShowCreateModal(true)
                        }
                    }}
                    className={`px-4 py-2 rounded-full ${
                        userProfile?.role === 'psychologue' && !userProfile?.is_verified
                            ? 'bg-gray-400'
                            : 'bg-blue-500'
                    }`}
                    disabled={userProfile?.role === 'psychologue' && !userProfile?.is_verified}
                >
                    <Ionicons name="add" size={24} color="white" />
                </Pressable>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {posts.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Text className="text-gray-500 text-lg">لا توجد منشورات بعد</Text>
                    </View>
                ) : (
                    posts.map(post => (
                        <View key={post.id} className="bg-white rounded-xl p-4 mb-4 mx-4 border border-gray-200 shadow-sm">
                            {/* Post Header */}
                            <View className="flex-row items-center mb-3">
                                <Pressable onPress={() => navigateToProfile(post.user_id)}>
                                    {post.profiles?.avatar_url ? (
                                        <Image
                                            source={{ uri: post.profiles.avatar_url }}
                                            className="w-12 h-12 rounded-full"
                                        />
                                    ) : (
                                        <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
                                            <Ionicons name="person" size={24} color="gray" />
                                        </View>
                                    )}
                                </Pressable>
                                <View className="mr-3 flex-1">
                                    <View className="flex-row items-center">
                                        <Pressable onPress={() => navigateToProfile(post.user_id)}>
                                            <Text className="font-bold text-right">{post.profiles?.full_name || 'مستخدم'}</Text>
                                        </Pressable>
                                        {post.profiles?.role === 'psychologue' && post.profiles?.is_verified && (
                                            <View className="flex-row items-center mr-2">
                                                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                                <Text className="text-green-600 text-xs mr-1">متحقق</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-gray-500 text-xs text-right">{formatDate(post.created_at)}</Text>
                                </View>
                                {(currentUser === post.user_id || userProfile?.role === 'admin') && 
                                 !(userProfile?.role === 'psychologue' && !userProfile?.is_verified) && (
                                    <View className="flex-row">
                                        {currentUser === post.user_id && (
                                            <Pressable
                                                onPress={() => {
                                                    setEditingPost(post.id)
                                                    setEditPostContent(post.content)
                                                }}
                                                className="p-2"
                                            >
                                                <Ionicons name="create-outline" size={20} color="#3b82f6" />
                                            </Pressable>
                                        )}
                                        <Pressable onPress={() => handleDeletePost(post.id)} className="p-2">
                                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                        </Pressable>
                                    </View>
                                )}
                            </View>

                            {/* Post Content */}
                            {editingPost === post.id ? (
                                <View className="mb-3">
                                    <TextInput
                                        className="border border-gray-300 rounded-lg p-3 text-right"
                                        multiline
                                        value={editPostContent}
                                        onChangeText={setEditPostContent}
                                    />
                                    <View className="flex-row gap-2 mt-2">
                                        <Pressable
                                            onPress={() => {
                                                setEditingPost(null)
                                                setEditPostContent('')
                                            }}
                                            className="flex-1 bg-gray-400 p-2 rounded-lg"
                                        >
                                            <Text className="text-white text-center">إلغاء</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => handleEditPost(post.id)}
                                            className="flex-1 bg-blue-500 p-2 rounded-lg"
                                        >
                                            <Text className="text-white text-center">حفظ</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ) : post.content ? (
                                <Text className="text-right mb-3 leading-6">{post.content}</Text>
                            ) : null}

                            {/* Post Image */}
                            {post.image_url ? (
                                <Image source={{ uri: post.image_url }} className="w-full h-64 rounded-xl mb-3" />
                            ) : null}

                            {/* Post Actions */}
                            <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                                <Pressable
                                    onPress={() => toggleLike(post.id, post.is_liked)}
                                    className={`flex-row items-center ${
                                        userProfile?.role === 'psychologue' && !userProfile?.is_verified
                                            ? 'opacity-50'
                                            : ''
                                    }`}
                                    disabled={userProfile?.role === 'psychologue' && !userProfile?.is_verified}
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
                                    {comments[post.id]?.map(comment => (
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
                                            className={`flex-1 border border-gray-300 rounded-lg p-2 text-right ${
                                                userProfile?.role === 'psychologue' && !userProfile?.is_verified
                                                    ? 'bg-gray-100'
                                                    : ''
                                            }`}
                                            placeholder={
                                                userProfile?.role === 'psychologue' && !userProfile?.is_verified
                                                    ? 'غير متاح - حساب قيد المراجعة'
                                                    : 'اكتب تعليقاً...'
                                            }
                                            value={newComment}
                                            onChangeText={setNewComment}
                                            onSubmitEditing={() => handleAddComment(post.id)}
                                            editable={!(userProfile?.role === 'psychologue' && !userProfile?.is_verified)}
                                        />
                                        <Pressable
                                            onPress={() => handleAddComment(post.id)}
                                            disabled={
                                                postingComment === post.id ||
                                                (userProfile?.role === 'psychologue' && !userProfile?.is_verified)
                                            }
                                            className="mr-2"
                                        >
                                            {postingComment === post.id ? (
                                                <ActivityIndicator size="small" />
                                            ) : (
                                                <Ionicons
                                                    name="send"
                                                    size={24}
                                                    color={
                                                        userProfile?.role === 'psychologue' && !userProfile?.is_verified
                                                            ? 'gray'
                                                            : 'blue'
                                                    }
                                                />
                                            )}
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Create Post Modal */}
            <Modal visible={showCreateModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end"
                >
                    <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
                        <View className="flex-row justify-between items-center mb-4">
                            <Pressable onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={28} color="gray" />
                            </Pressable>
                            <Text className="text-xl font-bold text-right">إنشاء منشور</Text>
                        </View>

                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 mb-4 h-32 text-right"
                            placeholder="ماذا يدور في ذهنك؟"
                            multiline
                            value={newPostContent}
                            onChangeText={setNewPostContent}
                        />

                        {newPostImage && (
                            <Image source={{ uri: newPostImage }} className="w-full h-48 rounded-xl mb-4" />
                        )}

                        <View className="flex-row justify-between">
                            <Pressable
                                onPress={pickImage}
                                className="bg-gray-200 px-4 py-2 rounded-lg"
                            >
                                <Ionicons name="image-outline" size={24} color="gray" />
                            </Pressable>

                            <Pressable
                                onPress={handleCreatePost}
                                disabled={creatingPost}
                                className="bg-blue-500 px-6 py-2 rounded-lg"
                            >
                                {creatingPost ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold">نشر</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    )
}

