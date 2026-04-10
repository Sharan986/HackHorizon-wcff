import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { glassTabBar } from "../theme";

export default function DoctorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: glassTabBar,
        tabBarItemStyle: {
          borderRadius: 100,
          marginVertical: 8,
          marginHorizontal: 4,
        },
        tabBarActiveBackgroundColor: '#EEEAF7',
        tabBarActiveTintColor: '#1B1E22',
        tabBarInactiveTintColor: '#7A8188',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="patients"
        options={{
          tabBarLabel: "Patients",
          tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clinical"
        options={{
          tabBarLabel: "Clinical",
          tabBarIcon: ({ color }) => <Feather name="activity" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color }) => <Feather name="settings" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
