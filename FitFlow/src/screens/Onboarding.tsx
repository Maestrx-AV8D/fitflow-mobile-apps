import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

const steps = ['Welcome', 'Experience', 'Goals', 'Age'] as const;
type Step = typeof steps[number];
type AgeRange =
  | 'Under 18'
  | '18–24'
  | '25–34'
  | '35–44'
  | '45–54'
  | '55–64'
  | 'Over 64';

export default function Onboarding() {
  const navigation = useNavigation<any>();
  const { setHasOnboarded } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const [experience, setExperience] = useState<'Beginner' | 'Intermediate' | 'Advanced' | ''>('');
  const [goals, setGoals] = useState('');
  const [age, setAge] = useState<AgeRange | ''>('');

  const handleNext = async () => {
    if (currentIndex < steps.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      setHasOnboarded(true);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  const skipToDashboard = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    setHasOnboarded(true);
    navigation.replace('SignIn');
  };

  const canNext = () => {
    const step = steps[currentIndex];
    if (step === 'Experience') return !!experience;
    if (step === 'Goals') return !!goals;
    if (step === 'Age') return !!age;
    return true;
  };

  const renderStep = ({ item }: { item: Step }) => {
    return (
      <View style={[styles.stepContainer, { width: Dimensions.get('window').width - 48 }]}>
        {item === 'Welcome' && (
          <>
            <Text style={styles.welcomeTitle}>FitFlow</Text>
            <Text style={styles.welcomeSub}>
              Your personalized fitness journey starts here. Swipe through to set your experience and goals.
            </Text>
          </>
        )}

        {item === 'Experience' && (
          <>
            <Text style={styles.questionTitle}>What’s your experience level?</Text>
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionBox,
                  experience === level && styles.optionBoxSelected,
                ]}
                onPress={() => setExperience(level)}
              >
                <Text
                  style={[
                    styles.optionText,
                    experience === level && styles.optionTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {item === 'Goals' && (
          <>
            <Text style={styles.questionTitle}>What are you working towards?</Text>
            <Text style={styles.subText}>Your answers will help shape the app around your needs.</Text>
            {[
              'Build strength',
              'Improve stamina',
              'Increase flexibility',
              'Lose weight',
              'Something else',
            ].map(goal => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.optionBox,
                  goals === goal && styles.optionBoxSelected,
                ]}
                onPress={() => setGoals(goal)}
              >
                <Text
                  style={[
                    styles.optionText,
                    goals === goal && styles.optionTextSelected,
                  ]}
                >
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {item === 'Age' && (
          <>
            <Text style={styles.questionTitle}>How old are you?</Text>
            <Text style={styles.subText}>Your answers will help shape the app around your needs.</Text>
            {(
              [
                'Under 18',
                '18–24',
                '25–34',
                '35–44',
                '45–54',
                '55–64',
                'Over 64',
              ] as const
            ).map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.optionBox,
                  age === range && styles.optionBoxSelected,
                ]}
                onPress={() => setAge(range)}
              >
                <Text
                  style={[
                    styles.optionText,
                    age === range && styles.optionTextSelected,
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.ageNote}>
              Your selections won’t limit access to any features.
            </Text>
          </>
        )}
      </View>
    );
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      {currentIndex > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
      )}
      {currentIndex > 0 && (
        <TouchableOpacity style={styles.skipButton} onPress={skipToDashboard}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={steps}
        horizontal
        pagingEnabled
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        renderItem={renderStep}
        onMomentumScrollEnd={onScrollEnd}
        scrollEnabled
      />

      <TouchableOpacity
        style={[styles.continueButton, !canNext() && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!canNext()}
      >
        <Text style={styles.buttonText}>
          {currentIndex === steps.length - 1 ? 'Continue' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCF9',
    paddingHorizontal: 24,
    paddingTop: 64,
    justifyContent: 'flex-start',
  },
  stepContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 180,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSub: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 14,
  },
  ageNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  optionBox: {
    width: '85%',
    alignSelf: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  optionBoxSelected: {
    backgroundColor: '#000',
  },
  optionText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#000',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 14,
    marginBottom: 36,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 120,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 14,
    color: '#999',
  },
  backButton: {
    position: 'absolute',
    top: 120,
    left: 24,
    zIndex: 10,
  },
  backText: {
    fontSize: 20,
    color: '#000',
  },
});