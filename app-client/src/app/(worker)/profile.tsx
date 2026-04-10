import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid, buttonShadow } from "../theme";
import {
  getWorkerProfile,
  updateWorkerProfile,
  type WorkerProfile,
} from "../services/api";

const EXPOSURE_TYPES = [
  { key: "dust", label: "Silica Dust", icon: "wind" },
  { key: "noise", label: "Noise", icon: "volume-2" },
  { key: "chemicals", label: "Chemicals", icon: "droplet" },
  { key: "heat", label: "Heat", icon: "sun" },
];

const JOB_ROLES = ["Mining Worker", "Steel Plant Operator", "Construction Worker"];
const EXP_YEARS = ["0-2", "3-5", "6-10", "10-15", "15+"];

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<WorkerProfile | null>(null);
  const [selectedExposures, setSelectedExposures] = useState<string[]>([]);
  const [selectedJobRole, setSelectedJobRole] = useState("Mining Worker");
  const [showJobRoles, setShowJobRoles] = useState(false);
  const [selectedYears, setSelectedYears] = useState("0-2");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    const result = await getWorkerProfile();
    if (result.success && result.data) {
      const p = result.data;
      setProfileData(p);
      setSelectedJobRole(p.jobRole || "Mining Worker");
      setSelectedYears(p.yearsOfExposure || "0-2");
      setSelectedExposures(p.exposureTypes || []);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchProfile();
      setIsLoading(false);
    })();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const toggleExposure = (key: string) => {
    setSelectedExposures((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  };

  const saveProfileData = async () => {
    setIsSaving(true);

    const result = await updateWorkerProfile({
      jobRole: selectedJobRole,
      yearsOfExposure: selectedYears,
      exposureTypes: selectedExposures,
    });

    setIsSaving(false);

    if (result.success) {
      Alert.alert("Success", "Profile updated successfully!");
      if (result.data) setProfileData(result.data);
    } else {
      Alert.alert("Error", result.message || "Failed to update profile.");
    }
  };

  // ─── Derived display values ─────────────────────────────────

  const displayName = profileData?.name || "Worker";
  const displayEmail = profileData?.email || "—";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B1E22" />}
      >
        <View className="mb-6">
          <Text className="text-[28px] font-bold text-[#1B1E22]">My Profile</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1">Manage your health profile</Text>
        </View>

        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#1B1E22" />
            <Text className="text-[14px] font-medium text-[#7A8188] mt-4">Loading profile…</Text>
          </View>
        ) : (
          <>
            {/* Profile Card */}
            <View className="rounded-[22px] p-5 mb-5" style={glassCardSolid}>
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-[22px] bg-[#EAF1F6] items-center justify-center mr-4">
                  <Text className="text-[22px] font-bold text-[#1B1E22]">{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[18px] font-bold text-[#1B1E22]">{displayName}</Text>
                  <Text className="text-[14px] font-medium text-[#7A8188] mt-1">{displayEmail}</Text>
                  <View className="bg-[#E6EBF0] px-3 py-1.5 rounded-[20px] self-start mt-2 flex-row items-center">
                    <Feather name="user" size={12} color="#1B1E22" />
                    <Text className="text-[12px] font-bold text-[#1B1E22] ml-1">
                      {profileData?.role ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1) : "Worker"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="w-11 h-11 rounded-[22px] bg-[#000000] items-center justify-center"
                  onPress={saveProfileData}
                  disabled={isSaving}
                  style={[buttonShadow, isSaving && { opacity: 0.6 }]}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Feather name="save" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Job Role Section */}
            <View className="rounded-[22px] p-5 my-3" style={glassCardSolid}>
              <Text className="text-[16px] font-bold text-[#1B1E22] mb-3">Job Role</Text>
              <TouchableOpacity
                className="flex-row justify-between items-center rounded-[22px] p-4"
                style={glassCard}
                onPress={() => setShowJobRoles(!showJobRoles)}
                activeOpacity={0.7}
              >
                <Text className="text-[15px] font-bold text-[#1B1E22]">{selectedJobRole}</Text>
                <Feather name={showJobRoles ? "chevron-up" : "chevron-down"} size={16} color="#7A8188" />
              </TouchableOpacity>
              {showJobRoles && (
                <View className="mt-3 rounded-[22px] overflow-hidden" style={glassCard}>
                  {JOB_ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      className={`flex-row justify-between items-center px-4 py-4 border-b border-white ${selectedJobRole === role ? 'bg-[#E7F3EA]' : 'bg-transparent'}`}
                      onPress={() => { setSelectedJobRole(role); setShowJobRoles(false); }}
                    >
                      <Text className={`text-[14px] font-bold ${selectedJobRole === role ? 'text-[#1B1E22]' : 'text-[#7A8188]'}`}>
                        {role}
                      </Text>
                      {selectedJobRole === role && <Feather name="check" size={16} color="#1B1E22" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Years of Exposure */}
            <View className="rounded-[22px] p-5 my-3" style={glassCardSolid}>
              <Text className="text-[16px] font-bold text-[#1B1E22] mb-3">Years of Exposure</Text>
              <View className="flex-row gap-2.5">
                {EXP_YEARS.map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    onPress={() => setSelectedYears(yr)}
                    className={`flex-1 items-center py-3 rounded-[20px] ${selectedYears === yr ? 'bg-[#000000]' : ''}`}
                    style={selectedYears !== yr ? glassCard : buttonShadow}
                  >
                    <Text className={`text-[14px] font-bold ${selectedYears === yr ? 'text-white' : 'text-[#7A8188]'}`}>
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Exposure Types */}
            <View className="rounded-[22px] p-5 my-3" style={glassCardSolid}>
              <Text className="text-[16px] font-bold text-[#1B1E22] mb-1">Exposure Types</Text>
              <Text className="text-[13px] font-medium text-[#7A8188] mb-4">Select all hazards you're exposed to</Text>
              <View className="flex-row flex-wrap gap-3">
                {EXPOSURE_TYPES.map((exp) => {
                  const isActive = selectedExposures.includes(exp.key);
                  return (
                    <TouchableOpacity
                      key={exp.key}
                      onPress={() => toggleExposure(exp.key)}
                      activeOpacity={0.7}
                      className={`w-[47%] flex-row items-center py-4 px-4 rounded-[22px] ${isActive ? 'bg-[#EAF1F6]' : ''}`}
                      style={isActive ? glassCard : { ...glassCard, backgroundColor: 'rgba(244,246,247,0.5)' }}
                    >
                      <Feather name={exp.icon as any} size={20} color={isActive ? "#1B1E22" : "#7A8188"} style={{ marginRight: 10 }} />
                      <Text className={`text-[14px] font-bold ${isActive ? 'text-[#1B1E22]' : 'text-[#7A8188]'}`}>{exp.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save Button (larger, accessible) */}
            <TouchableOpacity
              className="bg-[#000000] rounded-[30px] h-[52px] justify-center items-center my-3 flex-row"
              activeOpacity={0.8}
              onPress={saveProfileData}
              disabled={isSaving}
              style={[buttonShadow, isSaving && { opacity: 0.7 }]}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="save" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text className="text-[16px] font-bold text-white">Save Profile</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Settings Links */}
            <View className="rounded-[22px] mb-5 overflow-hidden mt-3" style={glassCardSolid}>
              {['Notifications', 'Privacy & Security', 'Help & Support'].map((item, i) => (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.6}
                  className={`flex-row items-center px-5 py-4 ${i !== 2 ? 'border-b border-[#F4F6F7]' : ''}`}
                >
                  <Text className="flex-1 text-[16px] font-bold text-[#1B1E22]">{item}</Text>
                  <Feather name="chevron-right" size={20} color="#7A8188" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout */}
            <TouchableOpacity
              className="bg-[#000000] rounded-[30px] h-[52px] justify-center items-center my-3"
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert("Logout", "Are you sure you want to logout?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Logout", style: "destructive", onPress: () => router.replace("/(auth)/login") },
                ])
              }
              style={buttonShadow}
            >
              <Text className="text-[16px] font-bold text-white">Log Out</Text>
            </TouchableOpacity>

            <Text className="text-center text-[12px] font-medium text-[#7A8188]" style={{ marginTop: 24 }}>
              MedChain v1.0.0
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
