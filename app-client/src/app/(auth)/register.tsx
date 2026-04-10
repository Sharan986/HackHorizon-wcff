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
import { registerUser } from "../services/api";

const ROLES = [
  {
    id: "worker",
    label: "Worker",
    desc: "Monitor your health, view AI risk assessments, and track medical reports securely.",
    icon: "user",
  },
  {
    id: "doctor",
    label: "Doctor",
    desc: "Manage patients, run clinical AI analysis, and track exposure metrics.",
    icon: "activity",
  },
  {
    id: "employer",
    label: "Employer",
    desc: "View workforce risk heatmaps, compliance stats, and organizational insights.",
    icon: "briefcase",
  },
];

export default function RegisterScreen() {
  const [activeRole, setActiveRole] = useState("worker");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Basic validation
    if (!name.trim()) {
      return Alert.alert("Validation Error", "Please enter your full name.");
    }
    if (!email.trim()) {
      return Alert.alert("Validation Error", "Please enter your email address.");
    }
    if (!password.trim() || password.length < 6) {
      return Alert.alert("Validation Error", "Password must be at least 6 characters.");
    }

    setIsLoading(true);

    const result = await registerUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role: activeRole,
    });

    setIsLoading(false);

    if (result.success) {
      // TODO: Store token/user data in AsyncStorage or context
      Alert.alert("Account Created", "Welcome to MedChain!", [
        {
          text: "Continue",
          onPress: () => {
            if (activeRole === "doctor") {
              router.replace("/(doctor)/patients");
            } else if (activeRole === "employer") {
              router.replace("/(employer)/dashboard");
            } else {
              router.replace("/(worker)/home");
            }
          },
        },
      ]);
    } else {
      Alert.alert("Registration Failed", result.message || "Could not create account. Please try again.");
    }
  };

  const selectedRoleDesc = ROLES.find(r => r.id === activeRole)?.desc;

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <StatusBar style="dark" />

      {/* Dynamic Background Elements */}
      <View className="absolute w-[400px] h-[400px] rounded-full bg-[#EAF1F6] -top-[150px] -right-[150px] opacity-70" />
      <View className="absolute w-[250px] h-[250px] rounded-full bg-[#E7F3EA] top-[150px] -left-[100px] opacity-50" />
      <View className="absolute w-[150px] h-[150px] rounded-full bg-[#EEEAF7] bottom-[80px] right-[20px] opacity-40" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 80, paddingBottom: 100 }}>

        {/* Branding & Welcome */}
        <View className="mb-10 mt-4">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full items-center justify-center" style={glassCard}>
              <Feather name="arrow-left" size={20} color="#1B1E22" />
            </TouchableOpacity>
          </View>
          <Text className="text-[42px] font-bold text-[#1B1E22] tracking-tight leading-[48px]">
            Join{"\n"}MedChain
          </Text>
          <Text className="text-[16px] font-medium text-[#7A8188] mt-3">
            Create an account to get started
          </Text>
        </View>

        {/* Minimal Role Selector — Glass */}
        <Text className="text-[14px] font-bold text-[#1B1E22] uppercase tracking-wider mb-4 ml-1 opacity-80">
          Account Type
        </Text>
        <View className="flex-row rounded-[30px] p-1.5" style={glassCardSolid}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.id}
              activeOpacity={0.8}
              onPress={() => setActiveRole(role.id)}
              className={`flex-1 flex-row items-center justify-center py-3.5 rounded-[24px] ${activeRole === role.id ? "bg-[#1B1E22]" : "bg-transparent"
                }`}
            >
              <Feather
                name={role.icon as any}
                size={16}
                color={activeRole === role.id ? "#FFFFFF" : "#7A8188"}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`text-[13px] font-bold ${activeRole === role.id ? "text-white" : "text-[#7A8188]"
                  }`}
              >
                {role.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-[13px] font-medium text-[#7A8188] mt-4 mb-8 text-center leading-[20px] px-2">
          {selectedRoleDesc}
        </Text>

        {/* Clean Input Form — Glass Inputs */}
        <View className="gap-5 mb-10">
          <View>
            <Text className="text-[14px] font-bold text-[#1B1E22] mb-2 ml-2">Full Name</Text>
            <View className="flex-row items-center rounded-[24px] px-5 h-[64px]" style={glassCardSolid}>
              <Feather name="user" size={20} color="#7A8188" />
              <TextInput
                placeholder="John Doe"
                placeholderTextColor="#A0A5AA"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
                className="flex-1 text-[16px] font-bold text-[#1B1E22] ml-4 h-full"
              />
            </View>
          </View>

          <View>
            <Text className="text-[14px] font-bold text-[#1B1E22] mb-2 ml-2">Email</Text>
            <View className="flex-row items-center rounded-[24px] px-5 h-[64px]" style={glassCardSolid}>
              <Feather name="mail" size={20} color="#7A8188" />
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#A0A5AA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                className="flex-1 text-[16px] font-bold text-[#1B1E22] ml-4 h-full"
              />
            </View>
          </View>

          <View>
            <Text className="text-[14px] font-bold text-[#1B1E22] mb-2 ml-2">Password</Text>
            <View className="flex-row items-center rounded-[24px] px-5 h-[64px]" style={glassCardSolid}>
              <Feather name="lock" size={20} color="#7A8188" />
              <TextInput
                placeholder="Create a strong password"
                placeholderTextColor="#A0A5AA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                className="flex-1 text-[16px] font-bold text-[#1B1E22] ml-4 h-full"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-3 py-2">
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#1B1E22" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleRegister}
          disabled={isLoading}
          className="bg-[#1B1E22] rounded-[32px] h-[64px] justify-center items-center flex-row mb-8"
          style={[buttonShadow, isLoading && { opacity: 0.7 }]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text className="text-white text-[18px] font-bold mr-2">Create Account</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Footer Area */}
        <Text className="text-[13px] font-medium text-[#7A8188] text-center leading-[20px] px-4">
          By signing up, you agree to our <Text className="font-bold text-[#1B1E22]">Terms of Service</Text> and <Text className="font-bold text-[#1B1E22]">Privacy Policy</Text>.
        </Text>

      </ScrollView>
    </View>
  );
}