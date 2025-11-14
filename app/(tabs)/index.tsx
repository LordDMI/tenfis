import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
    const router = useRouter();

    return (
        <View className="flex-1 justify-center items-center bg-background">
            <Text className="text-primary text-2xl font-bold">مرحبا بكم في تطبيق تنفيس</Text>
            <Pressable
                className="mt-4 px-4 py-2 bg-primary rounded-lg"
                onPress={() => router.push("./Screens/login")}

            >
                <Text className="text-white text-lg">سجل الأن</Text>
            </Pressable>


        </View>
    );
}
