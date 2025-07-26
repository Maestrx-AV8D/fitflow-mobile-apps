import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { verifyLoginCode } from '../lib/api'
import { useNavigation, useRoute } from '@react-navigation/native'

export default function VerifyCode() {
  const nav = useNavigation()
  const { params } = useRoute()
  const email = (params as any).email as string

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerify() {
    if (code.trim().length !== 6) return Alert.alert('Enter 6-digit code')
    setLoading(true)
    try {
      await verifyLoginCode(email, code.trim())
      nav.navigate('Main' as never)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter the code we sent to</Text>
      <Text style={styles.email}>{email}</Text>
      <TextInput
        placeholder="123456"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        style={styles.input}
        maxLength={6}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0C15',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    color: '#CAC6DD',
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#15131D',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 20,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#7ADB78',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1B1B2E',
    fontWeight: '600',
    fontSize: 16,
  },
})