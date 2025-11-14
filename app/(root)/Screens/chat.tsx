import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    SafeAreaView,
} from 'react-native'
import { supabase } from '@/utils/supabaseClient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

interface ChatRoom {
    id: string
    patient_id: string
    therapist_id: string
    created_at: string
    updated_at: string
    patient: {
        id: string
        full_name: string
        avatar_url: string | null
    }
    therapist: {
        id: string
        full_name: string
        avatar_url: string | null
    }
    last_message: {
        content: string
        created_at: string
    } | null
    unread_count: number
}

interface Message {
    id: string
    chat_room_id: string
    sender_id: string
    content: string
    created_at: string
    read_at: string | null
    profiles: {
        id: string
        full_name: string
        avatar_url: string | null
    }
}

export default function Chat() {
    const { roomId } = useLocalSearchParams<{ roomId?: string }>()
    const router = useRouter()
    const [view, setView] = useState<'rooms' | 'messages'>('rooms')
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [currentUser, setCurrentUser] = useState<string | null>(null)
    const scrollViewRef = useRef<ScrollView>(null)
    const messageSubscriptionRef = useRef<any>(null)

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
                    'لا يمكنك الوصول إلى المحادثات حتى يتم التحقق من حسابك من قبل الإدارة.'
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
        if (roomId) {
            fetchRoomAndMessages(roomId)
        } else {
            fetchChatRooms()
        }

        // Cleanup on unmount
        return () => {
            if (messageSubscriptionRef.current) {
                messageSubscriptionRef.current.unsubscribe()
                messageSubscriptionRef.current = null
            }
        }
    }, [roomId, checkAccessPermission])

    useEffect(() => {
        if (view === 'messages' && currentRoom) {
            const subscription = subscribeToMessages(currentRoom.id)
            messageSubscriptionRef.current = subscription

            return () => {
                if (subscription) {
                    subscription.unsubscribe()
                }
            }
        } else {
            // Cleanup subscription when leaving messages view
            if (messageSubscriptionRef.current) {
                messageSubscriptionRef.current.unsubscribe()
                messageSubscriptionRef.current = null
            }
        }
    }, [view, currentRoom, subscribeToMessages])

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user?.id || null)
    }

    const fetchChatRooms = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('chat_rooms')
                .select(`
                    *,
                    patient:patient_id (
                        id,
                        full_name,
                        avatar_url
                    ),
                    therapist:therapist_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .or(`patient_id.eq.${user.id},therapist_id.eq.${user.id}`)
                .order('updated_at', { ascending: false })

            if (error) throw error

            // Filter rooms to only show those with confirmed appointments
            const roomsWithConfirmedAppointments = await Promise.all(
                (data || []).map(async (room: any) => {
                    // Check if there's a confirmed appointment
                    const { data: confirmedAppointment } = await supabase
                        .from('appointments')
                        .select('id')
                        .eq('patient_id', room.patient_id)
                        .eq('therapist_id', room.therapist_id)
                        .eq('status', 'confirmed')
                        .maybeSingle()

                    // Only include rooms with confirmed appointments
                    if (!confirmedAppointment) return null

                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('content, created_at')
                        .eq('chat_room_id', room.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()

                    const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('chat_room_id', room.id)
                        .eq('read_at', null)
                        .neq('sender_id', user.id)

                    return {
                        ...room,
                        last_message: lastMsg || null,
                        unread_count: count || 0,
                    }
                })
            )

            // Filter out null values (rooms without confirmed appointments)
            setChatRooms(roomsWithConfirmedAppointments.filter(room => room !== null))
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحميل المحادثات')
        } finally {
            setLoading(false)
        }
    }

    const fetchRoomAndMessages = async (roomId: string) => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch room
            const { data: roomData, error: roomError } = await supabase
                .from('chat_rooms')
                .select(`
                    *,
                    patient:patient_id (
                        id,
                        full_name,
                        avatar_url
                    ),
                    therapist:therapist_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('id', roomId)
                .single()

            if (roomError) throw roomError
            if (!roomData) return

            setCurrentRoom(roomData as any)
            setView('messages')

            // Fetch messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select(`
                    *,
                    profiles:sender_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('chat_room_id', roomId)
                .order('created_at', { ascending: true })

            if (messagesError) throw messagesError

            setMessages(messagesData || [])

            // Mark messages as read
            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('chat_room_id', roomId)
                .eq('read_at', null)
                .neq('sender_id', user.id)
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحميل المحادثة')
        } finally {
            setLoading(false)
        }
    }

    const subscribeToMessages = useCallback((roomId: string) => {
        const subscription = supabase
            .channel(`messages:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_room_id=eq.${roomId}`,
                },
                async (payload) => {
                    const newMessage = payload.new as any
                    // Fetch full message with profile
                    const { data } = await supabase
                        .from('messages')
                        .select(`
                            *,
                            profiles:sender_id (
                                id,
                                full_name,
                                avatar_url
                            )
                        `)
                        .eq('id', newMessage.id)
                        .maybeSingle()

                    if (data) {
                        setMessages(prev => {
                            // Avoid duplicates
                            if (prev.some(m => m.id === data.id)) {
                                return prev
                            }
                            return [...prev, data]
                        })
                        scrollViewRef.current?.scrollToEnd({ animated: true })

                        // Mark as read if it's not from current user
                        if (data.sender_id !== currentUser) {
                            await supabase
                                .from('messages')
                                .update({ read_at: new Date().toISOString() })
                                .eq('id', data.id)
                            
                            // Refresh chat rooms to update unread count
                            fetchChatRooms()
                        }
                    }
                }
            )
            .subscribe()

        return subscription
    }, [currentUser])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentRoom || !currentUser) return

        const content = newMessage.trim()
        setNewMessage('')
        setSending(true)

        // Optimistic update
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            chat_room_id: currentRoom.id,
            sender_id: currentUser,
            content,
            created_at: new Date().toISOString(),
            read_at: null,
            profiles: {
                id: currentUser,
                full_name: 'أنت',
                avatar_url: null,
            },
        }

        setMessages(prev => [...prev, optimisticMessage])
        scrollViewRef.current?.scrollToEnd({ animated: true })

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    chat_room_id: currentRoom.id,
                    sender_id: currentUser,
                    content,
                })
                .select(`
                    *,
                    profiles:sender_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .maybeSingle()

            if (error) throw error

            // Replace optimistic message
            if (data) {
                setMessages(prev => prev.filter(m => !m.id.startsWith('temp')).concat(data))
            } else {
                // If no data returned, remove optimistic message
                setMessages(prev => prev.filter(m => !m.id.startsWith('temp')))
            }

            // Update room's updated_at
            await supabase
                .from('chat_rooms')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', currentRoom.id)

            // Refresh chat rooms list to update last message
            if (view === 'rooms') {
                fetchChatRooms()
            }
        } catch (error: any) {
            // Revert optimistic update
            setMessages(prev => prev.filter(m => !m.id.startsWith('temp')))
            Alert.alert('خطأ', error.message || 'فشل إرسال الرسالة')
        } finally {
            setSending(false)
        }
    }


    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    }

    if (view === 'rooms') {
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
                <View className="bg-white px-4 py-3 border-b border-gray-200">
                    <Text className="text-2xl font-bold text-right">المحادثات</Text>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" />
                    </View>
                ) : chatRooms.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="chatbubbles-outline" size={64} color="gray" />
                        <Text className="text-gray-500 text-lg mt-4">لا توجد محادثات</Text>
                    </View>
                ) : (
                    <ScrollView className="flex-1">
                        {chatRooms.map(room => {
                            const otherPerson =
                                currentUser === room.patient_id ? room.therapist : room.patient
                            return (
                                <Pressable
                                    key={room.id}
                                    onPress={() => {
                                        // Mark unread messages as read when opening room
                                        if (room.unread_count > 0) {
                                            supabase
                                                .from('messages')
                                                .update({ read_at: new Date().toISOString() })
                                                .eq('chat_room_id', room.id)
                                                .eq('read_at', null)
                                                .neq('sender_id', currentUser)
                                        }
                                        fetchRoomAndMessages(room.id)
                                    }}
                                    className="bg-white border-b border-gray-200 p-4 active:opacity-70"
                                >
                                    <View className="flex-row items-center">
                                        {otherPerson?.avatar_url ? (
                                            <Image
                                                source={{ uri: otherPerson.avatar_url }}
                                                className="w-14 h-14 rounded-full"
                                            />
                                        ) : (
                                            <View className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center">
                                                <Ionicons name="person" size={28} color="gray" />
                                            </View>
                                        )}
                                        <View className="mr-3 flex-1">
                                            <View className="flex-row items-center justify-between mb-1">
                                                <Text className="font-bold text-lg text-right">
                                                    {otherPerson?.full_name || 'مستخدم'}
                                                </Text>
                                                {room.unread_count > 0 && (
                                                    <View className="bg-blue-500 rounded-full px-2 py-1">
                                                        <Text className="text-white text-xs">
                                                            {room.unread_count}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            {room.last_message && (
                                                <Text
                                                    className="text-gray-600 text-sm text-right"
                                                    numberOfLines={1}
                                                >
                                                    {room.last_message.content}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </Pressable>
                            )
                        })}
                    </ScrollView>
                )}
        </SafeAreaView>
        )
    }

    // Messages view
    const otherPerson =
        currentUser === currentRoom?.patient_id ? currentRoom?.therapist : currentRoom?.patient

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
                <Pressable 
                    onPress={() => {
                        setView('rooms')
                        setCurrentRoom(null)
                        setMessages([])
                        fetchChatRooms()
                    }} 
                    className="mr-3"
                >
                    <Ionicons name="arrow-back" size={24} color="gray" />
                </Pressable>
                {otherPerson?.avatar_url ? (
                    <Image source={{ uri: otherPerson.avatar_url }} className="w-10 h-10 rounded-full" />
                ) : (
                    <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center">
                        <Ionicons name="person" size={20} color="gray" />
                    </View>
                )}
                <Text className="mr-3 text-lg font-bold flex-1 text-right">
                    {otherPerson?.full_name || 'مستخدم'}
                </Text>
            </View>

            <ScrollView
                ref={scrollViewRef}
                className="flex-1 p-4"
                onContentSizeChange={() => {
                    setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true })
                    }, 100)
                }}
            >
                {messages.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="chatbubble-outline" size={64} color="gray" />
                        <Text className="text-gray-500 text-lg mt-4">لا توجد رسائل بعد</Text>
                        <Text className="text-gray-400 text-sm mt-2">ابدأ المحادثة الآن</Text>
                    </View>
                ) : (
                    messages.map(message => {
                    const isMe = message.sender_id === currentUser
                    return (
                        <View
                            key={message.id}
                            className={`mb-3 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            {!isMe && (
                                <>
                                    {message.profiles?.avatar_url ? (
                                        <Image
                                            source={{ uri: message.profiles.avatar_url }}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <View className="w-8 h-8 rounded-full bg-gray-300" />
                                    )}
                                </>
                            )}
                            <View
                                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                    isMe ? 'bg-blue-500 mr-2' : 'bg-white ml-2 border border-gray-200'
                                }`}
                            >
                                <Text className={isMe ? 'text-white' : 'text-gray-800'}>
                                    {message.content}
                                </Text>
                                <Text
                                    className={`text-xs mt-1 ${
                                        isMe ? 'text-blue-100' : 'text-gray-400'
                                    }`}
                                >
                                    {formatTime(message.created_at)}
                                </Text>
                            </View>
                            {isMe && (
                                <>
                                    {message.profiles?.avatar_url ? (
                                        <Image
                                            source={{ uri: message.profiles.avatar_url }}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <View className="w-8 h-8 rounded-full bg-gray-300" />
                                    )}
                                </>
                            )}
                        </View>
                    )
                }))}
            </ScrollView>

            <View className="bg-white border-t border-gray-200 px-4 py-3 flex-row items-center">
                <TextInput
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-right"
                    placeholder="اكتب رسالة..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />
                <Pressable
                    onPress={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="ml-3 bg-blue-500 rounded-full p-2"
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Ionicons name="send" size={20} color="white" />
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

