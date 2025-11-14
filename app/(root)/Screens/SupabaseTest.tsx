import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { supabase } from '@/utils/supabaseClient'

export default function SupabaseTest() {
    const [status, setStatus] = useState('Testing connection...')

    useEffect(() => {
        const testSupabase = async () => {
            const { data, error } = await supabase.from('test_table').select('*').limit(1)

            if (error) {
                setStatus(`❌ Error: ${error.message}`)
            } else {
                setStatus(`✅ Connected! Data: ${JSON.stringify(data)}`)
            }
        }

        testSupabase()
    }, [])

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{status}</Text>
        </View>
    )
}
