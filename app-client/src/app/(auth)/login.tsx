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
import { glassCard, glassCardSolid, buttonShadow } from "../theme";
import { loginUser } from "../services/api";

const ROLES = [
  { id: "worker", label: "Worker", icon: "user" },
  { id: "doctor", label: "Doctor", icon: "activity" },
  { id: "employer", label: "Employer", icon: "briefcase" },
];

export default function LoginScreen() {
  const [activeRole, setActiveRole] = useState("worker");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim()) {
      return Alert.alert("Validation Error", "Please enter your email address.");
    }
    if (!password.trim()) {
      return Alert.alert("Validation Error", "Please enter your password.");
    }

    setIsLoading(true);

    const result = await loginUser({
      email: email.trim(),
      password,
      role: activeRole,
    });

    setIsLoading(false);

    if (result.success) {
      // TODO: Store token/user data in AsyncStorage or context
      // Navigate based on role
      if (activeRole === "doctor") {
        router.replace("/(doctor)/patients");
      } else if (activeRole === "employer") {
        router.replace("/(employer)/dashboard");
      } else {
        router.replace("/(worker)/home");
      }
    } else {
      Alert.alert("Login Failed", result.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      {/* Decorative Background Circles */}
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />

      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}>

        {/* Branding */}
        <View className="items-center mb-10 mt-6">
          <View className="w-[80px] h-[80px] rounded-[30px] items-center justify-center mb-4" style={glassCardSolid}>
            <Feather name="plus-square" size={36} color="#1B1E22" />
          </View>
          <Text className="text-[32px] font-bold text-[#1B1E22]">MedChain</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1 text-center">
            Occupational Health Intelligence
          </Text>
        </View>

        {/* Welcome Text */}
        <View className="mb-6 items-center">
          <Text className="text-[28px] font-bold text-[#1B1E22]">Welcome Back</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1 text-center">
            Sign in to access your dashboard
          </Text>
        </View>

        {/* Role Selector */}
        <Text className="text-[16px] font-bold text-[#1B1E22] mb-3">I am a</Text>
        <View className="flex-row justify-between mb-8 gap-2">
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.id}
              activeOpacity={0.7}
              onPress={() => setActiveRole(role.id)}
              className={`flex-1 flex-row items-center justify-center p-4 rounded-[22px]`}
              style={activeRole === role.id
                ? { backgroundColor: '#000000', ...buttonShadow }
                : glassCard
              }
            >
              <View className="mr-2">
                <Feather name={role.icon as any} size={20} color={activeRole === role.id ? "#FFFFFF" : "#1B1E22"} />
              </View>
              <Text
                className={`text-[14px] font-bold ${activeRole === role.id ? "text-white" : "text-[#7A8188]"}`}
              >
                {role.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Login Form Container — Glass Card */}
        <View className="p-6 rounded-[22px] mb-8" style={glassCardSolid}>

          <Text className="text-[14px] font-bold text-[#1B1E22] mb-2">Email Address</Text>
          <View className="flex-row items-center bg-[#F4F6F7] rounded-[20px] px-4 h-[56px] mb-5"
            style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <View className="mr-3"><Feather name="mail" size={18} color="#1B1E22" /></View>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor="#7A8188"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
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

      </ScrollView>
    </View>
  );
}