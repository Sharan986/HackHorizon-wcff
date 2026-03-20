import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { glassCardSolid, buttonShadow } from "../theme";
import { loginUser, saveToken } from "../services/api";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      return Alert.alert("Validation Error", "Please enter your username or email.");
    }
    if (!password.trim()) {
      return Alert.alert("Validation Error", "Please enter your password.");
    }

    setIsLoading(true);

    const result = await loginUser({
      identifier: identifier.trim(),
      password,
    });

    setIsLoading(false);

    if (result.success && result.data) {
      // Save token securely
      await saveToken(result.data.access_token);
      
      // The backend returns flags to determine onboarding state
      if (!result.data.is_employee || !result.data.has_employee_onboarded) {
        // Force them to the profile page to complete onboarding
        router.replace("/(worker)/profile");
      } else {
        router.replace("/(worker)/home");
      }
    } else {
      Alert.alert("Login Failed", result.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />

      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}>

        <View className="items-center mb-10 mt-6">
          <View className="w-[80px] h-[80px] rounded-[30px] items-center justify-center mb-4" style={glassCardSolid}>
            <Feather name="plus-square" size={36} color="#1B1E22" />
          </View>
          <Text className="text-[32px] font-bold text-[#1B1E22]">Medora</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1 text-center">
            Occupational Health Intelligence
          </Text>
        </View>

        <View className="mb-6 items-center">
          <Text className="text-[28px] font-bold text-[#1B1E22]">Welcome Back</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1 text-center">
            Sign in to access your dashboard
          </Text>
        </View>

        <View className="p-6 rounded-[22px] mb-8" style={glassCardSolid}>

          <Text className="text-[14px] font-bold text-[#1B1E22] mb-2">Username or Email</Text>
          <View className="flex-row items-center bg-[#F4F6F7] rounded-[20px] px-4 h-[56px] mb-5"
            style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <View className="mr-3"><Feather name="user" size={18} color="#1B1E22" /></View>
            <TextInput
              placeholder="e.g. johndoe1 or you@example.com"
              placeholderTextColor="#7A8188"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              editable={!isLoading}
              className="flex-1 text-[16px] font-medium text-[#1B1E22]"
            />
          </View>

          <Text className="text-[14px] font-bold text-[#1B1E22] mb-2">Password</Text>
          <View className="flex-row items-center bg-[#F4F6F7] rounded-[20px] px-4 h-[56px] mb-2"
            style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <View className="mr-3"><Feather name="lock" size={18} color="#1B1E22" /></View>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#7A8188"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              className="flex-1 text-[16px] font-medium text-[#1B1E22]"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#7A8188" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="self-end mt-2 mb-6">
            <Text className="text-[14px] font-bold text-[#1B1E22]">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-[#000000] rounded-[30px] h-[52px] justify-center items-center flex-row"
            style={[buttonShadow, isLoading && { opacity: 0.7 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white text-[16px] font-bold">Sign In</Text>
            )}
          </TouchableOpacity>

        </View>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")} className="items-center mb-6">
            <Text className="text-[14px] font-medium text-[#7A8188]">
              Don't have an account? <Text className="font-bold text-[#1B1E22]">Sign Up</Text>
            </Text>
        </TouchableOpacity>

        {/* Independent Medical Scanner View */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.push("/(auth)/scan" as any)}
          className="flex-row items-center justify-center p-4 rounded-[20px] bg-[#EAF1F6] border border-[#E6EBF0]"
        >
          <Feather name="maximize" size={18} color="#1B1E22" style={{marginRight: 8}} />
          <Text className="text-[14px] font-bold text-[#1B1E22]">Provider QR Scanner</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}