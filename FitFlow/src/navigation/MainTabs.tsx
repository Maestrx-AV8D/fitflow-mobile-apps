// navigation/MainTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'

import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native'
import FloatingOverlay from '../components/FloatingOverlay'
import History from '../screens/History'
import Schedule from '../screens/Schedule'
import SmartWorkout from '../screens/SmartWorkout'
import { useTheme } from '../theme/theme'
import MainStack from './MainStack'

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [fabExpanded, setFabExpanded] = React.useState(false);
  const { colors, spacing, typography } = useTheme();

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => {
          let iconName: string;
          let IconComp: typeof MaterialIcons | typeof Ionicons;

          switch (route.name) {
            case 'Home':
              IconComp = MaterialIcons;
              iconName = 'home-filled';
              break;
            case 'History':
              IconComp = MaterialIcons;
              iconName = 'history';
              break;
            case 'Schedule':
              IconComp = Ionicons;
              iconName = 'calendar-outline';
              break;
            case 'Coach':
              IconComp = Ionicons;
              iconName = 'flash-outline';
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
            tabBarLabelStyle: { fontSize: 12, marginBottom: 6, marginTop: 2 },
            tabBarStyle: {
              position: 'absolute',
              left: spacing.md,
              right: spacing.md,
              //bottom: spacing.xs,
              height: 90,
              borderRadius: 15,
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
        <Tab.Screen name="Home" component={MainStack} options={{ tabBarLabel: 'Home' }} />
        <Tab.Screen name="Schedule" component={Schedule} options={{ tabBarLabel: 'Schedule' }} />
        <Tab.Screen
          name="Star"
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
        <Tab.Screen name="Coach" component={SmartWorkout} options={{ tabBarLabel: 'Coach' }} />  
         <Tab.Screen name="History" component={History} options={{ tabBarLabel: 'History' }} />
      </Tab.Navigator>

      {/* Overlay Menu */}
      {fabExpanded && <FloatingOverlay onClose={() => setFabExpanded(false)} />}
    </>
  );
}
const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    //top: -28,
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