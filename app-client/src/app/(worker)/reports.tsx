import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from 'expo-image-picker';
import QRCode from "react-native-qrcode-svg";
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid, buttonShadow } from "../theme";
import {
  getReports,
  uploadReport,
  shareReports,
  type PatientReport,
} from "../services/api";

export default function ReportsScreen() {
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Upload Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [reportFile, setReportFile] = useState<any>(null);
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("General Report");

  // Share Engine State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareConfig, setShareConfig] = useState<{ id: string, pin: string } | null>(null);

  const fetchReports = useCallback(async () => {
    const result = await getReports();
    if (result.success && result.data) {
      setReports(result.data || []);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchReports();
      setIsLoading(false);
    })();
  }, [fetchReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

  // ─── Upload Logic ───────────────────────────────────────────

  const handlePickDocument = () => {
    Alert.alert("Upload Document", "Choose a source", [
      { text: "Camera", onPress: openCamera },
      { text: "Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Need Permission", "Please grant camera permission.");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setReportFile(result.assets[0]);
      setReportName(`Scan_${new Date().toISOString().split('T')[0]}`);
      setModalVisible(true);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Need Permission", "Please grant gallery permission.");
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      mediaTypes: ['images'],
    });
    if (!result.canceled && result.assets[0]) {
      setReportFile(result.assets[0]);
      setReportName(`Upload_${new Date().toISOString().split('T')[0]}`);
      setModalVisible(true);
    }
  };

  const submitReport = async () => {
    if (!reportName.trim()) {
       Alert.alert("Error", "Please provide a report name");
       return;
    }
    
    setIsUploading(true);
    setModalVisible(false);

    const fileName = reportFile.fileName || `report_${Date.now()}.jpg`;
    const ext = fileName.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'pdf') mimeType = 'application/pdf';

    const result = await uploadReport({
      report_name: reportName,
      report_type: reportType,
      fileUri: reportFile.uri,
      fileName: fileName,
      mimeType: mimeType,
    });

    setIsUploading(false);
    setReportFile(null); // Clear

    if (result.success) {
      Alert.alert("Success", "Report uploaded and processing started.");
      await fetchReports(); 
    } else {
      Alert.alert("Upload Failed", result.message || "Could not upload report.");
    }
  };

  // ─── Sharing Logic ───────────────────────────────────────────

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
       setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
       setSelectedIds([...selectedIds, id]);
    }
  }

  const generateShareToken = async () => {
    if (selectedIds.length === 0) return;
    setIsSharing(true);
    
    const result = await shareReports({
       report_ids: selectedIds,
       permanent: false,
       expires_hours: 24
    });

    setIsSharing(false);

    if (result.success && result.data) {
       setShareConfig({
         id: result.data.share_id,
         pin: result.data.pin
       });
       setIsSelectionMode(false);
       setSelectedIds([]);
    } else {
       Alert.alert("Error", result.message || "Could not generate secure token.");
    }
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B1E22" />}
      >
        <View className="mb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-[28px] font-bold text-[#1B1E22]">Medical Reports</Text>
            <Text className="text-[14px] font-medium text-[#7A8188] mt-1">
              {isLoading ? "Loading…" : `${reports.length} report${reports.length !== 1 ? 's' : ''} saved`}
            </Text>
          </View>
          <TouchableOpacity 
             onPress={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}
             className={`w-11 h-11 rounded-[22px] items-center justify-center ${isSelectionMode ? 'bg-[#1B1E22]' : 'bg-[#E7F3EA]'}`}
          >
            <Feather name="share-2" size={18} color={isSelectionMode ? "white" : "#1B1E22"} />
          </TouchableOpacity>
        </View>

        {!isSelectionMode && (
          <TouchableOpacity
            onPress={handlePickDocument}
            activeOpacity={0.7}
            disabled={isUploading}
            className="rounded-[22px] p-6 items-center border-[2px] border-dashed border-[#E6EBF0] mb-8"
            style={[glassCard, isUploading && { opacity: 0.6 }]}
          >
            <View className="w-16 h-16 rounded-[22px] bg-[#EAF1F6] items-center justify-center mb-3">
              {isUploading ? (
                <ActivityIndicator size="large" color="#1B1E22" />
              ) : (
                <Feather name="upload-cloud" size={32} color="#1B1E22" />
              )}
            </View>
            <Text className="text-[18px] font-bold text-[#1B1E22] mb-1">
              {isUploading ? "Uploading…" : "Add Medical Record"}
            </Text>
            <Text className="text-[14px] text-[#7A8188] mb-4 text-center">Take a photo or upload an image of your report</Text>
            <View className="bg-[#000000] rounded-[30px] px-6 py-3" style={buttonShadow}>
              <Text className="text-white text-[14px] font-bold">Choose File</Text>
            </View>
          </TouchableOpacity>
        )}

        {isSelectionMode && (
           <View className="rounded-[20px] p-4 mb-5 bg-[#E6EBF0] flex-row items-center border border-[#1B1E22]">
             <Feather name="info" size={16} color="#1B1E22" style={{marginRight: 8}}/>
             <Text className="text-[13px] font-medium text-[#1B1E22] flex-1">
               Select reports to generate a secure AES-256 encrypted access token.
             </Text>
           </View>
        )}

        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#1B1E22" />
            <Text className="text-[14px] font-medium text-[#7A8188] mt-3">Loading reports…</Text>
          </View>
        ) : reports.map((report) => {
            const isSelected = selectedIds.includes(report.id);
            return (
              <TouchableOpacity
                key={report.id}
                activeOpacity={0.8}
                onPress={() => isSelectionMode ? toggleSelection(report.id) : {}}
                className={`rounded-[22px] p-5 my-2 ${isSelected ? 'border-2 border-[#1B1E22]' : ''}`}
                style={glassCardSolid}
              >
                <View className="flex-row items-center mb-1">
                  
                  {isSelectionMode ? (
                     <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${isSelected ? 'border-[#1B1E22] bg-[#1B1E22]' : 'border-[#A0A5AA]'}`}>
                       {isSelected && <Feather name="check" size={14} color="white" />}
                     </View>
                  ) : (
                    <View className={`w-12 h-12 rounded-[20px] items-center justify-center mr-4 bg-[#EAF1F6]`}>
                      <Feather name="file-text" size={22} color="#1B1E22" />
                    </View>
                  )}

                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1B1E22]">{report.report_name}</Text>
                    <Text className="text-[13px] font-medium text-[#7A8188] mt-1">{report.report_type}</Text>
                  </View>
                </View>

                {report.prescription_data && Object.keys(report.prescription_data).length > 0 && !isSelectionMode && (
                  <View className="flex-row flex-wrap gap-2 mt-4 pt-4 border-t border-[#E6EBF0]">
                    <View className="flex-row items-center bg-[#E7F3EA] rounded-[20px] px-3.5 py-1.5 gap-2">
                       <Feather name="check" size={12} color="#1B1E22" />
                       <Text className="text-[12px] font-bold text-[#1B1E22]">OCR Data Extracted</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        }
      </ScrollView>

      {/* Floating Action for selected share */}
      {isSelectionMode && selectedIds.length > 0 && (
         <View className="absolute bottom-6 left-0 right-0 px-6">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={generateShareToken}
              disabled={isSharing}
              className="w-full bg-[#1B1E22] rounded-[30px] h-[58px] flex-row items-center justify-center"
              style={buttonShadow}
            >
               {isSharing ? (
                 <ActivityIndicator color="white" />
               ) : (
                 <>
                   <Feather name="lock" size={18} color="white" style={{marginRight: 8}} />
                   <Text className="text-white font-bold text-[16px]">Generate Secure Token</Text>
                 </>
               )}
            </TouchableOpacity>
         </View>
      )}

      {/* QR Code Delivery Modal */}
      <Modal visible={!!shareConfig} transparent animationType="slide">
         <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="w-full bg-white rounded-[24px] p-6 shadow-lg items-center">
               <View className="w-16 h-16 rounded-[24px] bg-[#E7F3EA] items-center justify-center mb-4">
                 <Feather name="shield" size={28} color="#1B1E22" />
               </View>
               <Text className="text-[20px] font-bold text-[#1B1E22] mb-1">Encrypted Payload Target</Text>
               <Text className="text-[13px] font-medium text-[#7A8188] text-center mb-6 px-4">
                 Show this QR code to independent medical reviewers. They can securely intercept, scan and evaluate your data locally without tracking.
               </Text>
               
               {/* QR CODE RENDERING */}
               <View className="p-4 bg-white rounded-[16px] border border-[#E6EBF0] mb-6">
                 {shareConfig && <QRCode value={shareConfig.id} size={200} />}
               </View>

               <Text className="text-[12px] font-medium text-[#A0A5AA] uppercase tracking-wider mb-2">Decrypt PIN Code</Text>
               <Text className="text-[32px] font-bold text-[#1B1E22] tracking-[8px] mb-6">{shareConfig?.pin}</Text>

               <TouchableOpacity 
                 activeOpacity={0.8} 
                 onPress={() => setShareConfig(null)}
                 className="w-full bg-[#F4F6F7] rounded-[24px] h-[52px] items-center justify-center"
               >
                 <Text className="text-[15px] font-bold text-[#1B1E22]">Dismiss</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

      {/* Upload Form Modal */}
      {/* ... previous modal ... */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
           <View className="w-full bg-[#FFFFFF] rounded-[24px] p-6 shadow-lg">
              <Text className="text-[20px] font-bold text-[#1B1E22] mb-4">Report Details</Text>
              
              <Text className="text-[13px] font-bold text-[#7A8188] mb-2">Report Name</Text>
              <TextInput
                className="bg-[#F4F6F7] rounded-[16px] h-[52px] px-4 font-medium text-[#1B1E22] mb-4"
                value={reportName}
                onChangeText={setReportName}
              />
              
              <Text className="text-[13px] font-bold text-[#7A8188] mb-2">Report Type</Text>
              <TextInput
                className="bg-[#F4F6F7] rounded-[16px] h-[52px] px-4 font-medium text-[#1B1E22] mb-6"
                value={reportType}
                onChangeText={setReportType}
              />
              
              <View className="flex-row justify-end space-x-3 gap-3">
                 <TouchableOpacity 
                   onPress={() => { setModalVisible(false); setReportFile(null); }}
                   className="px-5 py-3 rounded-[20px] bg-[#F4F6F7]"
                 >
                    <Text className="font-bold text-[#1B1E22]">Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={submitReport}
                   className="px-5 py-3 rounded-[20px] bg-[#1B1E22]"
                 >
                    <Text className="font-bold text-white">Upload</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

    </View>
  );
}
