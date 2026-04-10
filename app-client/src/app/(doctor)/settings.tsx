import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid, buttonShadow } from "../theme";

const SETTINGS_SECTIONS = [
  {
    title: "Account",
    items: [
      { id: "profile", label: "Edit Profile", icon: "user" },
      { id: "notifications", label: "Notifications", icon: "bell" },
      { id: "security", label: "Security & Passwords", icon: "lock" },
    ],
  },
  {
    title: "Clinical Preferences",
    items: [
      { id: "ai", label: "AI Analysis Sensitivity", icon: "cpu" },
      { id: "templates", label: "Report Templates", icon: "file-text" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", label: "Help Center", icon: "help-circle" },
      { id: "terms", label: "Terms of Service", icon: "info" },
    ],
  },
];

export default function DoctorSettingsScreen() {
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => router.replace("/(auth)/login"),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-[28px] font-bold text-[#1B1E22]">Settings</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1">Manage your provider account</Text>
        </View>

        {/* Profile Card — Glass */}
        <View className="rounded-[22px] p-5 mb-6" style={glassCardSolid}>
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 rounded-[22px] bg-[#EEEAF7] items-center justify-center mr-4">
              <Text className="text-[24px] font-bold text-[#1B1E22]">DR</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[18px] font-bold text-[#1B1E22]">Dr. Sarah Jenkins</Text>
              <Text className="text-[14px] font-medium text-[#7A8188] mt-1">Pulmonologist</Text>
              <View className="bg-[#E6EBF0] px-3 py-1.5 rounded-[20px] self-start mt-2">
                <Text className="text-[12px] font-bold text-[#1B1E22]">ID: MED-8842</Text>
              </View>
            </View>
          </View>
          <View className="flex-row border-t border-[#E6EBF0] pt-4">
            <View className="flex-1 items-center">
              <Text className="text-[18px] font-bold text-[#1B1E22]">248</Text>
              <Text className="text-[12px] font-bold text-[#7A8188] mt-1">Patients</Text>
            </View>
            <View className="w-[1px] bg-[#E6EBF0]" />
            <View className="flex-1 items-center">
              <Text className="text-[18px] font-bold text-[#1B1E22]">12</Text>
              <Text className="text-[12px] font-bold text-[#7A8188] mt-1">Years Exp</Text>
            </View>
            <View className="w-[1px] bg-[#E6EBF0]" />
            <View className="flex-1 items-center">
              <Text className="text-[18px] font-bold text-[#1B1E22]">4.9</Text>
              <Text className="text-[12px] font-bold text-[#7A8188] mt-1">Rating</Text>
            </View>
          </View>
        </View>

        {/* Settings Sections — Glass */}
        {SETTINGS_SECTIONS.map((section, idx) => (
          <View key={idx} className="mb-6">
            <Text className="text-[16px] font-bold text-[#1B1E22] mb-3 ml-2">{section.title}</Text>
            <View className="rounded-[22px] overflow-hidden" style={glassCardSolid}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  className={`flex-row items-center p-4 pl-5 ${i !== section.items.length - 1 ? 'border-b border-[#F4F6F7]' : ''}`}
                >
                  <View className="mr-4"><Feather name={item.icon as any} size={20} color="#1B1E22" /></View>
                  <Text className="flex-[1] text-[16px] font-bold text-[#1B1E22]">{item.label}</Text>
                  <View><Feather name="chevron-right" size={20} color="#7A8188" /></View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-[#000000] rounded-[30px] h-[52px] justify-center items-center my-3"
          activeOpacity={0.7}
          onPress={handleLogout}
          style={buttonShadow}
        >
          <Text className="text-[16px] font-bold text-white">Log Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-[12px] font-medium text-[#7A8188] mt-6">MedChain Pro v1.0.0</Text>

      </ScrollView>
    </View>
  );
}
