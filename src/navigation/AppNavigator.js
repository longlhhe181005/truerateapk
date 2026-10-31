import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ConsentScreen from '../screens/ConsentScreen';
import CheckScreen from '../screens/CheckScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LendersScreen from '../screens/LendersScreen';
import GuideScreen from '../screens/GuideScreen';
import useApp from '../hooks/useApp';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const TABS = {
  Check: ['Kiểm tra', 'calculator'],
  History: ['Lịch sử', 'time'],
  Lenders: ['Bên cho vay', 'business'],
  Guide: ['Hướng dẫn', 'book'],
};

function Tabs() {
  const { history, saveHistory } = useApp();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabel: TABS[route.name][0],
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? TABS[route.name][1] : `${TABS[route.name][1]}-outline`}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Check" component={CheckScreen} />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarBadge: saveHistory && history.length ? history.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.bg },
        }}
      />
      <Tab.Screen name="Lenders" component={LendersScreen} />
      <Tab.Screen name="Guide" component={GuideScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { ready, consented } = useApp();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {consented ? (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{ title: 'Kết quả', headerBackTitle: 'Quay lại' }}
            />
          </>
        ) : (
          <Stack.Screen name="Consent" component={ConsentScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
