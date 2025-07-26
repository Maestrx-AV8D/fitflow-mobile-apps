// src/navigation/AppNavigator.tsx
import React from 'react'
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  createNavigationContainerRef,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useColorScheme } from 'react-native'
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'

import { useAuth } from '../hooks/useAuth'
import SignIn        from '../screens/SignIn'
import Dashboard     from '../screens/Dashboard'
import Log           from '../screens/Log'
import History       from '../screens/History'
import SmartWorkout  from '../screens/SmartWorkout'
import Schedule      from '../screens/Schedule'
import Profile       from '../screens/Profile'
import VerifyCode from '../screens/VerifyCode'
import Onboarding from '../screens/Onboarding'
import { useTheme } from '../theme/theme'
import FloatingOverlay from '../components/FloatingOverlay'

export const navigationRef = createNavigationContainerRef<ReactNavigation.RootParamList>()

const Stack = createNativeStackNavigator()
const Tabs  = createBottomTabNavigator()

function MainTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [fabExpanded, setFabExpanded] = React.useState(false);
  const { colors, spacing, typography } = useTheme();

  return (
    <>
      <Tabs.Navigator
        screenOptions={({ route }) => {
          let iconName: string;
          let IconComp: typeof MaterialIcons | typeof Ionicons;

          switch (route.name) {
            case 'Dashboard':
              IconComp = MaterialIcons;
              iconName = 'home-filled';
              break;
            case 'History':
              IconComp = MaterialIcons;
              iconName = 'history';
              break;
            case 'Coach':
              IconComp = Ionicons;
              iconName = 'flash-outline';
              break;
            case 'Profile':
              IconComp = Ionicons;
              iconName = 'person-outline';
              break;
            default:
              IconComp = MaterialIcons;
              iconName = 'help-outline';
          }

          return {
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarLabelStyle: { fontSize: 12, marginBottom: 6 },
            tabBarStyle: {
              position: 'absolute',
              left: spacing.md,
              right: spacing.md,
              bottom: spacing.md,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.surface,
              shadowColor: colors.shadow,
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
            },
            tabBarIcon: ({ color }) => (
              <IconComp name={iconName} size={24} color={color} />
            ),
          };
        }}
      >
        <Tabs.Screen name="Dashboard" component={Dashboard} options={{ tabBarLabel: 'Home' }} />

        <Tabs.Screen
          name="Log"
          component={View} // hidden, placeholder
          options={{
            tabBarButton: () => (
              <TouchableOpacity
                style={[
                  styles.fab,
                  { backgroundColor: colors.primary }
                ]}
                onPress={() => setFabExpanded(prev => !prev)}
              >
                <Ionicons
                  name={fabExpanded ? 'close' : 'add'}
                  size={28}
                  color={colors.surface}
                />
              </TouchableOpacity>
            ),
            tabBarLabel: () => null,
          }}
        />

        <Tabs.Screen name="History" component={History} options={{ tabBarLabel: 'History' }} />
        <Tabs.Screen name="Coach" component={SmartWorkout} options={{ tabBarLabel: 'Coach' }} />
        <Tabs.Screen name="Profile" component={Profile} options={{ tabBarLabel: 'Profile' }} />
      </Tabs.Navigator>

      {/* Overlay Menu */}
      {fabExpanded && <FloatingOverlay onClose={() => setFabExpanded(false)} />}
    </>
  );
}

export default function AppNavigator() {
  const { user, loading, hasOnboarded } = useAuth()
  const scheme = useColorScheme()

  if (loading) return null

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme} ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : hasOnboarded ? (
        <Stack.Screen name="SignIn" component={SignIn} />
      ) : (
        <Stack.Screen name="Onboarding" component={Onboarding} />
      )}
    </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  backgroundDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  overlayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overlayButton: {
    alignItems: 'center',
    gap: 8,
  },
  overlayText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
});