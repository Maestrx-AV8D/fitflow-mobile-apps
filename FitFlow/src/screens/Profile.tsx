import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { getProfile, saveProfile, supabase } from '../lib/api'

export default function Profile() {
  const navigation = useNavigation<any>()
  const [form, setForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    height: '',
    weight: ''
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    ;(async () => {
      const data = await getProfile()
      if (data) {
        setForm(data)
        setEditing(false)
      } else {
        setEditing(true)
      }
      setLoading(false)
    })()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await saveProfile(form)
      setEditing(false)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigation.replace('Signin')
  }

  const GradientButton = ({ text, onPress, style = {} }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.gradientWrapper, style]}>
      <LinearGradient
        colors={['#1C1B23', '#000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Your Profile</Text>

        {editing ? (
          <>
            {(['fullName', 'age', 'gender', 'height', 'weight'] as const).map(key => (
              <View key={key} style={styles.formGroup}>
                <Text style={styles.label}>
                  {key === 'fullName'
                    ? 'Full Name'
                    : key === 'age'
                    ? 'Age'
                    : key === 'gender'
                    ? 'Gender'
                    : key === 'height'
                    ? 'Height (cm)'
                    : 'Weight (kg)'}
                </Text>
                <TextInput
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  style={styles.input}
                  keyboardType={key !== 'gender' && key !== 'fullName' ? 'numeric' : 'default'}
                  placeholder={
                    key === 'gender' ? 'male / female / other' : key === 'fullName' ? 'Your name' : undefined
                  }
                  placeholderTextColor="#757575"
                />
              </View>
            ))}
            <GradientButton text="Save Profile" onPress={handleSave} />
          </>
        ) : (
          <View style={styles.profileCard}>
            <Text style={styles.item}>👤 Name: {form.fullName}</Text>
            <Text style={styles.item}>🎂 Age: {form.age}</Text>
            <Text style={styles.item}>⚧ Gender: {form.gender}</Text>
            <Text style={styles.item}>📏 Height: {form.height} cm</Text>
            <Text style={styles.item}>⚖️ Weight: {form.weight} kg</Text>

            <View style={styles.actionsRow}>
              <GradientButton text="Edit" onPress={() => setEditing(true)} style={{ flex: 1, marginRight: 8 }} />
              <GradientButton text="Log Out" onPress={handleLogout} style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDFCF9'
  },
  container: {
    padding: 16,
    paddingTop: 70,
    paddingBottom: 100,
    backgroundColor: '#FDFCF9',
    flexGrow: 1
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFCF9'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    color: '#1A1A1A',
    marginBottom: 6,
    fontSize: 14
  },
  input: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    padding: 12,
    color: '#1A1A1A'
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  item: {
    color: '#1A1A1A',
    fontSize: 16,
    marginBottom: 10
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 24
  },
  gradientWrapper: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  button: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  }
})