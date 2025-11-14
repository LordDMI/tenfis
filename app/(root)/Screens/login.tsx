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
        <View className="flex-1 justify-center items-center bg-gray-100 px-6">
            <KeyboardAvoidingView behavior="padding" className="flex-1 w-full items-center justify-center">
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4 text-gray-800 shadow-sm focus:ring focus:ring-blue-300"
                    placeholder="البريد الإلكتروني"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    style={{
                        borderColor: '#d1d5db', // gray-300
                        shadowColor: '#000',
                    }}
                />

                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4 text-gray-800 shadow-sm focus:ring focus:ring-blue-300"
                    placeholder="كلمة المرور"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    style={{
                        borderColor: '#d1d5db', // gray-300
                        shadowColor: '#000',
                    }}
                />

                <Pressable
                    className={`w-full py-3 rounded-lg mb-3 ${loading ? 'bg-gray-400' : 'bg-blue-600'} active:opacity-70`}
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
                    <Link href="/Screens/signup" className="text-blue-500 underline font-medium">
                        <Text> انضم إلينا الآن!</Text>
                    </Link>
                    <Text className="text-gray-700 font-medium"> ليس لديك حساب؟ </Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    )
}
