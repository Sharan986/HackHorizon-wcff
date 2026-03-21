import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput, ScrollView, Image } from "react-native";
import { Camera, CameraView } from "expo-camera";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { glassCardSolid, buttonShadow } from "../theme";
import { getSharedReport } from "../services/api";
import { decryptSharedReportPayload } from "../services/crypto";

export default function SecurescanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedData, setDecryptedData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scannedId) return; // Prevent multiple scans
    setScannedId(data);
  };

  const handleDecrypt = async () => {
    if (!pin || pin.length !== 6) {
      return Alert.alert("Error", "Please enter a valid 6-digit PIN.");
    }
    
    setIsLoading(true);
    
    // 1. Fetch encrypted AES-GCM material payload from public API
    const response = await getSharedReport(scannedId!, pin);
    
    if (response.success && response.data) {
       try {
         // 2. Perform local Client-Side decryption logic utilizing Pure JS Node-Forge
         const payload = response.data;
         
         const results = decryptSharedReportPayload(
            payload.share_id,
            pin,
            payload.encrypted_payload,
            payload.nonce,
            payload.key_part_a
         );

         // 3. Store in State to Render!
         setDecryptedData(results);
       } catch(e: any) {
         Alert.alert("Decryption Failed", e.message || "Invalid PIN or corrupted key package.");
         setScannedId(null);
         setPin("");
       }
    } else {
       Alert.alert("Failed", response.message || "The share link expired or was locked due to incorrect attempts.");
       setScannedId(null);
       setPin("");
    }
    setIsLoading(false);
  }

  if (hasPermission === null) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator color="#1B1E22" /></View>;
  }
  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F4F6F7] px-6">
        <Text className="text-[18px] font-bold text-[#1B1E22] mb-4">No access to camera</Text>
        <TouchableOpacity onPress={() => router.back()} className="px-6 py-3 bg-[#1B1E22] rounded-[20px]">
           <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F4F6F7]">
      
      {/* Header back button overlay */}
      <View className="absolute top-[60px] left-6 z-50">
         <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full items-center justify-center bg-white shadow-sm border border-gray-100">
           <Feather name="arrow-left" size={20} color="#1B1E22" />
         </TouchableOpacity>
      </View>

      {decryptedData ? (
         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 130, paddingBottom: 100 }}>
             <View className="mb-6">
               <Text className="text-[28px] font-bold text-[#1B1E22]">Decrypted Record</Text>
               <Text className="text-[14px] font-medium text-[#7A8188] mt-1">Independent secure viewing</Text>
             </View>

             {decryptedData.reports && decryptedData.reports.map((report: any, idx: number) => (
                <View key={idx} className="rounded-[22px] p-6 mb-4 bg-white" style={buttonShadow}>
                   <View className="flex-row items-center border-b border-gray-100 pb-4 mb-4">
                     <View className="w-12 h-12 bg-[#E7F3EA] rounded-full justify-center items-center mr-4">
                        <Feather name="shield" size={20} color="#1B1E22" />
                     </View>
                     <View className="flex-1">
                        <Text className="text-[18px] font-bold text-[#1B1E22]">{report.report_name}</Text>
                        <Text className="text-[14px] font-medium text-[#7A8188] mt-1">{report.report_type}</Text>
                     </View>
                   </View>
                   
                   {report.report_description && (
                     <View className="mb-4 bg-[#F4F6F7] p-4 rounded-[16px]">
                       <Text className="text-[13px] font-bold text-[#1B1E22] mb-1">Description</Text>
                       <Text className="text-[14px] font-medium text-[#7A8188]">{report.report_description}</Text>
                     </View>
                   )}

                   {/* Render Prescription Data securely sent */}
                   {report.prescription_data && Object.keys(report.prescription_data).length > 0 && (
                      <View className="mb-4">
                        <Text className="text-[14px] font-bold text-[#1B1E22] mb-2 px-1">Extracted Logic</Text>
                        <View className="flex-row flex-wrap gap-2">
                           {Object.entries(report.prescription_data).map(([k, v]: any) => (
                              <View key={k} className="bg-[#E6EBF0] px-3 py-1.5 rounded-[12px]">
                                 <Text className="text-[11px] font-medium text-[#7A8188] mb-0.5 uppercase tracking-wider">{k}</Text>
                                 <Text className="text-[13px] font-bold text-[#1B1E22]">{String(v)}</Text>
                              </View>
                           ))}
                        </View>
                      </View>
                   )}

                   {/* Render Documents payload natively! */}
                   {report.document_images && report.document_images.length > 0 && (
                      <View>
                        <Text className="text-[14px] font-bold text-[#1B1E22] mb-3 px-1">Decrypted Documents</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                           {report.document_images.map((img: any, x: number) => (
                              <Image 
                                key={x} 
                                source={{ uri: `data:image/png;base64,${img.data}` }} 
                                style={{ width: 280, height: 350, borderRadius: 16, marginRight: 12, backgroundColor: '#E6EBF0' }}
                                resizeMode="cover"
                              />
                           ))}
                        </ScrollView>
                      </View>
                   )}
                </View>
             ))}
         </ScrollView>
      ) : !scannedId ? (
         /* SCANNER UI */
         <View className="flex-1">
           <CameraView 
             style={{ flex: 1 }} 
             onBarcodeScanned={scannedId ? undefined : handleBarCodeScanned}
             barcodeScannerSettings={{
               barcodeTypes: ["qr"],
             }}
           />
           <View className="absolute bottom-12 left-6 right-6 p-6 bg-white rounded-[24px]" style={buttonShadow}>
              <View className="flex-row items-center justify-center mb-2">
                <Feather name="maximize-2" size={24} color="#1B1E22" />
              </View>
              <Text className="text-[18px] font-bold text-[#1B1E22] text-center mb-1">Verify Independent Report</Text>
              <Text className="text-[13px] font-medium text-[#7A8188] text-center">Point your camera at a patient's generated QR code to intercept the encrypted share token.</Text>
           </View>
         </View>
      ) : (
         /* PIN ENTRY UI */
         <View className="flex-1 justify-center items-center px-6 bg-[#F4F6F7]">
            <View className="w-full p-8 bg-white rounded-[24px]" style={glassCardSolid}>
               <View className="w-16 h-16 rounded-[24px] bg-[#EAF1F6] items-center justify-center mb-6 self-center">
                 <Feather name="lock" size={28} color="#1B1E22" />
               </View>
               <Text className="text-[20px] font-bold text-[#1B1E22] text-center mb-2">Payload Intercepted</Text>
               <Text className="text-[13px] font-medium text-[#7A8188] text-center mb-8">
                 Ask the patient for the 6-Digit AES Decryption PIN to unlock their medical record natively on your device.
               </Text>
               
               <TextInput
                 className="w-full h-[64px] bg-[#F4F6F7] rounded-[20px] px-6 text-[24px] font-bold tracking-[10px] text-center text-[#1B1E22] mb-6 border border-[#E6EBF0]"
                 placeholder="000000"
                 placeholderTextColor="#A0A5AA"
                 keyboardType="number-pad"
                 maxLength={6}
                 value={pin}
                 onChangeText={setPin}
               />
               
               <TouchableOpacity 
                 activeOpacity={0.8}
                 onPress={handleDecrypt}
                 disabled={isLoading}
                 className="w-full bg-[#1B1E22] rounded-[30px] h-[58px] flex-row items-center justify-center"
                 style={buttonShadow}
               >
                 {isLoading ? (
                    <ActivityIndicator color="white" />
                 ) : (
                    <>
                      <Feather name="key" size={18} color="white" style={{marginRight: 8}} />
                      <Text className="text-white font-bold text-[16px]">Attempt Decryption</Text>
                    </>
                 )}
               </TouchableOpacity>
               
               <TouchableOpacity onPress={() => setScannedId(null)} className="mt-6 items-center">
                  <Text className="text-[14px] font-bold text-[#7A8188]">Cancel</Text>
               </TouchableOpacity>
            </View>
         </View>
      )}
    </View>
  );
}
