import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
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
  makeEmployee,
  onboardUser,
  updateProfile,
  getToken,
  clearToken,
} from "../services/api";

const JOB_ROLES = ["Mining Engineer", "Assembly Worker", "Chemical Handler", "Furnace Operator", "General Labor"];

export default function ProfileScreen() {
  const [jobRole, setJobRole] = useState("");
  const [showJobRoles, setShowJobRoles] = useState(false);
  const [workingSince, setWorkingSince] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [allergies, setAllergies] = useState("");
  const [existingConditions, setExistingConditions] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // We assume if they reached here, we might need to initialize them as employee
  // In a real flow, you'd fetch the user profile GET /profile to check if boarded.
  // But backend doesn't have an explicit GET /profile for onboarding status (just via login Token).
  
  const handleSave = async () => {
    if (!jobRole || !workingSince || !workLocation) {
      return Alert.alert("Missing Fields", "Please fill out required fields (role, date, location). Location is critical for NASA environmental data!");
    }

    setIsSaving(true);
    
    // Attempt onboarding first, if it says "User already has employee profile" or fails, we fallback to patch
    let result = await onboardUser({
      job_role: jobRole,
      working_since: workingSince,
      work_location: workLocation,
      allergies: allergies,
      existing_conditions: existingConditions,
    });

    if (result.success || result.message?.includes("already has")) {
      // It was either successful or already boarded (which means we should use PATCH)
      if (result.message?.includes("already has")) {
         result = await updateProfile({
            job_role: jobRole,
            working_since: workingSince,
            work_location: workLocation,
            allergies: allergies,
            existing_conditions: existingConditions,
         });
      }
      
      setIsSaving(false);
      
      if (result.success) {
        Alert.alert("Success", "Profile updated. Your NASA environment profile is being built!", [
          { text: "Go to Dashboard", onPress: () => router.replace("/(worker)/home") }
        ]);
        setHasOnboarded(true);
      } else {
        Alert.alert("Error", result.message || "Failed to update profile.");
      }
    } else {
      setIsSaving(false);
      Alert.alert("Error", result.message || "Failed to onboard profile.");
    }
  };

  const initEmployee = async () => {
    // Ensuring user is an employee flag in db
    await makeEmployee();
  }

  useEffect(() => {
    initEmployee();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
         await clearToken();
         router.replace("/(auth)/login");
      }},
    ]);
  }

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}>
        
        <View className="mb-6">
          <Text className="text-[28px] font-bold text-[#1B1E22]">My Profile</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1">Complete your health & occupational profile</Text>
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
            <Text className={`text-[15px] font-bold ${jobRole ? 'text-[#1B1E22]' : 'text-[#7A8188]'}`}>
              {jobRole || "Select your job role"}
            </Text>
            <Feather name={showJobRoles ? "chevron-up" : "chevron-down"} size={16} color="#7A8188" />
          </TouchableOpacity>
          {showJobRoles && (
            <View className="mt-3 rounded-[22px] overflow-hidden" style={glassCard}>
              {JOB_ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  className={`flex-row justify-between items-center px-4 py-4 border-b border-white ${jobRole === role ? 'bg-[#E7F3EA]' : 'bg-transparent'}`}
                  onPress={() => { setJobRole(role); setShowJobRoles(false); }}
                >
                  <Text className={`text-[14px] font-bold ${jobRole === role ? 'text-[#1B1E22]' : 'text-[#7A8188]'}`}>
                    {role}
                  </Text>
                  {jobRole === role && <Feather name="check" size={16} color="#1B1E22" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Working Since */}
        <View className="rounded-[22px] p-5 my-3" style={glassCardSolid}>
          <Text className="text-[16px] font-bold text-[#1B1E22] mb-1">Working Since</Text>
          <Text className="text-[12px] font-medium text-[#7A8188] mb-3">Format: YYYY-MM-DD</Text>
          <View className="flex-row items-center bg-[#F4F6F7] rounded-[20px] px-4 h-[56px]" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <Feather name="calendar" size={18} color="#1B1E22" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="e.g. 2021-05-01"
              placeholderTextColor="#7A8188"
              value={workingSince}
              onChangeText={setWorkingSince}
              className="flex-1 text-[16px] font-medium text-[#1B1E22]"
            />
          </View>
        </View>

        {/* Work Location (NASA integration) */}
        <View className="rounded-[22px] p-5 my-3" style={glassCardSolid}>
          <View className="flex-row items-center mb-1">
             <Text className="text-[16px] font-bold text-[#1B1E22] mr-2">Work Location</Text>
             <View className="bg-[#EAF1F6] px-2 py-0.5 rounded-full"><Text className="text-[10px] font-bold text-[#1B1E22]">NASA AI</Text></View>
          </View>
          <Text className="text-[12px] font-medium text-[#7A8188] mb-3">City, State/Country for climate extraction</Text>
          <View className="flex-row items-center bg-[#F4F6F7] rounded-[20px] px-4 h-[56px]" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <Feather name="map-pin" size={18} color="#1B1E22" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="e.g. Dhanbad, Jharkhand"
              placeholderTextColor="#7A8188"
              value={workLocation}
              onChangeText={setWorkLocation}
              className="flex-1 text-[16px] font-medium text-[#1B1E22]"
            />
          </View>
        </View>

        {/* Medical Context */}
        <View className="rounded-[22px] p-5 my-3" style={glassCardSolid}>
          <Text className="text-[16px] font-bold text-[#1B1E22] mb-3">Medical Context</Text>
          
          <Text className="text-[13px] font-bold text-[#7A8188] mb-2">Allergies</Text>
          <View className="flex-row items-start bg-[#F4F6F7] rounded-[20px] px-4 py-3 min-h-[80px] mb-4" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <TextInput
              placeholder="Dust, Pollen..."
              placeholderTextColor="#7A8188"
              value={allergies}
              onChangeText={setAllergies}
              multiline
              className="flex-1 text-[15px] font-medium text-[#1B1E22]"
            />
          </View>

          <Text className="text-[13px] font-bold text-[#7A8188] mb-2">Existing Conditions</Text>
          <View className="flex-row items-start bg-[#F4F6F7] rounded-[20px] px-4 py-3 min-h-[80px]" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
            <TextInput
              placeholder="Mild asthma..."
              placeholderTextColor="#7A8188"
              value={existingConditions}
              onChangeText={setExistingConditions}
              multiline
              className="flex-1 text-[15px] font-medium text-[#1B1E22]"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-[#000000] rounded-[30px] h-[52px] justify-center items-center my-3 flex-row"
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={isSaving}
          style={[buttonShadow, isSaving && { opacity: 0.7 }]}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="save" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text className="text-[16px] font-bold text-white">Save & Update AI</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(worker)/home")} className="items-center mt-3">
            <Text className="text-[14px] font-bold text-[#7A8188]">Go to Dashboard</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          className="bg-transparent border border-[#E6EBF0] rounded-[30px] h-[52px] justify-center items-center mt-10"
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Text className="text-[15px] font-bold text-[#1B1E22]">Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
