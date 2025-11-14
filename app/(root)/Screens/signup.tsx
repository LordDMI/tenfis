import {View, Text, Pressable, Alert} from 'react-native'
import React from 'react'
import {useRouter} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";

const Signup = () => {
    //---router---
    const router = useRouter();
    //--------
    const handlePress = () => {
        try {
            router.replace("./patient/ptsignup");

        } catch (error) {
            console.error("Navigation failed:", error);
            Alert.alert("error");
        }
    };
    return (
        <LinearGradient
            colors={["#B0DB9C", "#4CAF50"]} // your gradient colors
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 justify-center items-center"
        >

        <View className={"flex-1 w-full items-center justify-center "}>

            {/* main*/}


            {/* patient users */}

            <Pressable
            className={"overflow-hidden  border-2 border-success w-1/2 items-center justify-center bg-tertiary  active:border-green-300 py-3 rounded-3xl mb-6 "}

            onPress={handlePress}
            >
                <Text className={"text-light_primary text-2xl  "}>
                     أنا مستخدم
                </Text>
            </Pressable>

            {/* psychologue users */}

            <Pressable
                className={"overflow-hidden  border-2 border-success w-1/2 items-center justify-center bg-tertiary  active:border-green-300 py-3 rounded-3xl mb-6 "}
                onPress={()=> {
                    router.push("./psychologue/psysignup");

                }}
            >
                <Text className={"text-light_primary text-2xl "}>
                    أنا مختص
                </Text>
            </Pressable>



        </View>
            </LinearGradient>
    )
}
export default Signup
