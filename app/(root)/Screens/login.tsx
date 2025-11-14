import React, { useState } from 'react'
import { View, TextInput, Text, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '@/utils/supabaseClient'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSignIn = async () => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                Alert.alert('خطأ', error.message)
            } else {
                // AuthWrapper will auto-redirect based on role
            }
        } catch (e: any) {
            Alert.alert('خطأ غير متوقع', e?.message || 'حدث خطأ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 justify-center items-center px-6">
            <KeyboardAvoidingView behavior="padding" className="flex-1 w-full items-center justify-center">
                <TextInput
                    className="w-full border border-black rounded-3xl p-3 mb-4 text-black"
                    placeholder="البريد الإلكتروني"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    className="w-full border border-black rounded-3xl p-3 mb-4 text-black"
                    placeholder="كلمة المرور"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <Pressable
                    className="w-full bg-black py-3 rounded-lg mb-3 active:opacity-70"
                    onPress={handleSignIn}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text className="text-white text-center font-bold">تسجيل الدخول</Text>
                    )}
                </Pressable>

                <View className="flex-row justify-center items-center">
                    <Link href="/Screens/signup" className="font-bold text-lg underline text-blue-500">
                        <Text> انضم إلينا الآن!</Text>
                    </Link>
                    <Text className="font-bold text-lg"> ليس لديك حساب؟ </Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    )
}
