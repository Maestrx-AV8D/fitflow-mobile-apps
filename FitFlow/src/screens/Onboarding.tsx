// src/screens/Onboarding.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// now includes the “Welcome” page
const steps = ['Welcome', 'Experience', 'Goals', 'Equipment'] as const;
type Step = typeof steps[number];

type EquipmentOption = 'Dumbbells' | 'Resistance Bands' | 'Barbell' | 'None';

export default function Onboarding() {
    const { setHasOnboarded } = useAuth()
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState<Step>('Welcome');

  // your form state
  const [experience, setExperience] = useState<'Beginner'|'Intermediate'|'Advanced' | ''>('');
  const [goals, setGoals]         = useState('');
  const [equipment, setEquipment] = useState<EquipmentOption[]>([]);

  // advance to next
  async function handleNext() {
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1]);
    } else {
        await AsyncStorage.setItem('hasOnboarded', 'true')
        setHasOnboarded(true)
      // TODO: save all data (Supabase / AsyncStorage) then:
      navigation.navigate('SignIn' as never);
    }
  }

  // equipment toggler
  function toggleEquipment(opt: EquipmentOption) {
    setEquipment(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  }

  // validation per step
  let canNext = true;
  switch (currentStep) {
    case 'Experience': canNext = !!experience; break;
    case 'Goals':      canNext = goals.trim().length > 0; break;
    case 'Equipment':  canNext = equipment.length > 0; break;
  }

  // render the body per step
  const renderContent = () => {
    if (currentStep === 'Welcome') {
      return (
        <View style={styles.stepContainer}>
          {/* replace with your actual logo */}
          <Text style={styles.welcomeText}>
            Welcome to FitFlow!  Your personalized fitness journey starts here.
          </Text>
        </View>
      );
    }
    if (currentStep === 'Experience') {
      return (
        <View style={styles.stepContainer}>
          {(['Beginner','Intermediate','Advanced'] as const).map(level => (
            <TouchableOpacity
              key={level}
              onPress={() => setExperience(level)}
              style={[
                styles.option,
                experience === level && styles.selectedOption,
              ]}
            >
              <Text style={styles.optionText}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (currentStep === 'Goals') {
      return (
        <View style={styles.stepContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lose weight, build muscle"
            placeholderTextColor="#757185"
            value={goals}
            onChangeText={setGoals}
          />
        </View>
      );
    }
    if (currentStep === 'Equipment') {
      return (
        <View style={styles.stepContainer}>
          {(['Dumbbells','Resistance Bands','Barbell','None'] as const).map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => toggleEquipment(opt)}
              style={[
                styles.option,
                equipment.includes(opt) && styles.selectedOption,
              ]}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return null;
  };

  // progress indicator (dots)
  const idx = steps.indexOf(currentStep);
  const progressDots = steps.map((_, i) => (
    <View
      key={i}
      style={[
        styles.dot,
        i <= idx && styles.dotActive,
      ]}
    />
  ));

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.progressRow}>{progressDots}</View>

      <Text style={styles.stepLabel}>{currentStep}</Text>

      {renderContent()}

      <TouchableOpacity
        onPress={handleNext}
        style={[styles.nextButton, !canNext && styles.nextButtonDisabled]}
        disabled={currentStep !== 'Welcome' && !canNext}
      >
        <Text style={styles.nextText}>
          {currentStep === 'Welcome'
            ? 'Get Started'
            : currentStep === 'Equipment'
              ? 'Finish'
              : 'Next'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0E0C15',
  },
  progressRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E2A41',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#AC6AFF',
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  welcomeText: {
    color: '#CAC6DD',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  stepContainer: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  option: {
    width: '100%',
    padding: 16,
    backgroundColor: '#2E2A41',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: '#AC6AFF',
  },
  optionText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#2E2A41',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#AC6AFF',
    padding: 16,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});