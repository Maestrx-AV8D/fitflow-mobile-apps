// navigation/MainTabs.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import FloatingOverlay from '../components/FloatingOverlay';
import History from '../screens/History';
import Schedule from '../screens/Schedule';
import SmartWorkout from '../screens/SmartWorkout';
import { useTheme } from '../theme/theme';
import MainStack from './MainStack';

export const WorkoutContext = React.createContext<any>({
  activeWorkout: null,
  setActiveWorkout: (_: any) => {},
});

const Tab = createBottomTabNavigator()

export default function MainTabs({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [fabExpanded, setFabExpanded] = React.useState(false);
  const [activeWorkout, setActiveWorkout] = React.useState<any>(null);
  const { colors, spacing } = useTheme();

  const finishWorkout = () => {
    setActiveWorkout(null);
    // Additional logic to end workout can be added here
  };

  return (
    <WorkoutContext.Provider value={{ activeWorkout, setActiveWorkout }}>
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
        {/* <Tab.Screen name="Theme" component={ThemePreview} options={{ tabBarLabel: 'Theme' }} /> */}
        <Tab.Screen
          name="Star"
          component={View} // hidden placeholder
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

      {/* {activeWorkout && (
        <TouchableOpacity
          style={[styles.miniLogBar, { backgroundColor: colors.surface, shadowColor: colors.shadow, borderColor: colors.border }]}
          activeOpacity={0.85}
          // onPress={() => navigation?.navigate?.('Log')}
          onPress={() => navigation.navigate("Home", { screen: "Log" })}
        >
          <View style={styles.miniLogBarContent}>
            <View style={styles.miniLogBarInfo}>
              <Text style={[styles.miniLogBarTextPrimary, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {activeWorkout.name || 'Active Workout'}
              </Text>
              <Text style={[styles.miniLogBarTextSecondary, { color: colors.accent }]}>
                {activeWorkout.timer || '00:00'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.finishButton, { backgroundColor: colors.primary }]}
              onPress={(e) => {
                e.stopPropagation();
                finishWorkout();
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.finishButtonText, { color: colors.surface }]}>Finish</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )} */}
    </WorkoutContext.Provider>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
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
  miniLogBar: {
    position: 'absolute',
    bottom: 110, // moved slightly higher for visibility above nav bar
    left: 20,
    right: 20,
    height: 64,
    marginBottom: 6,
    borderRadius: 16,
    paddingHorizontal: 18,
    justifyContent: 'center',
    shadowOpacity: 0.2, // slightly stronger for clarity
    shadowRadius: 8,
    elevation: 14,
    zIndex: 4000, // ensure on top
    borderWidth: 1,
  },
  miniLogBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniLogBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    marginRight: 12,
  },
  miniLogBarTextPrimary: {
    fontWeight: '700',
    fontSize: 17,
    flexShrink: 1,
  },
  miniLogBarTextSecondary: {
    fontWeight: '700',
    fontSize: 17,
    marginLeft: 12,
  },
  finishButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
});