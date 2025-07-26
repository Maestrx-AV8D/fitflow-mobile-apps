// src/screens/Profile.tsx
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { getProfile, saveProfile, supabase } from '../lib/api'

export default function Profile() {
  const navigation = useNavigation<any>()
  const [form, setForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#AC6AFF" />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Profile</Text>

      {editing ? (
        <>
          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={form.fullName}
              onChangeText={v => setForm(f => ({ ...f, fullName: v }))}
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#757185"
            />
          </View>

          {/* Age / Gender / Height / Weight */}
          {(['age','gender','height','weight'] as const).map(key => (
            <View key={key} style={styles.formGroup}>
              <Text style={styles.label}>
                {key === 'age' ? 'Age' :
                 key === 'gender' ? 'Gender' :
                 key === 'height' ? 'Height (cm)' :
                 'Weight (kg)'}
              </Text>
              <TextInput
                value={form[key]}
                onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                style={styles.input}
                keyboardType={key !== 'gender' ? 'numeric' : 'default'}
                placeholder={key === 'gender' ? 'male / female / other' : undefined}
                placeholderTextColor="#757185"
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF"/>
              : <Text style={styles.buttonText}>Save Profile</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.profileView}>
          <Text style={styles.profileItem}>Name: {form.fullName}</Text>
          <Text style={styles.profileItem}>Age: {form.age}</Text>
          <Text style={styles.profileItem}>Gender: {form.gender}</Text>
          <Text style={styles.profileItem}>Height: {form.height} cm</Text>
          <Text style={styles.profileItem}>Weight: {form.weight} kg</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={[styles.button, styles.editButton]}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={[styles.button, styles.logoutButton]}
            >
              <Text style={styles.buttonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView></View>
  )
}

const styles = StyleSheet.create({
    screen: {
    flex: 1,
    backgroundColor: '#0E0C15',
  },
  container: {
    padding: 16,
    paddingTop: 70,
    backgroundColor: '#0E0C15',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0E0C15',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#AC6AFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#CAC6DD',
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#2E2A41',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#7ADB78',
  },
  editButton: {
    backgroundColor: '#858DFF',
    flex: 1,
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: '#FF776F',
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  profileView: {
    backgroundColor: '#2E2A41',
    borderRadius: 12,
    padding: 16,
  },
  profileItem: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
})