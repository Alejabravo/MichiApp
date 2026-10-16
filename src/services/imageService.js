import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform, ToastAndroid } from 'react-native';

// Servicio de imagenes: camara y galeria

function showMessage(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('MichiApp', message);
  }
}

async function requestCameraPermission() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    showMessage('Necesitamos permiso para usar la camara');
    return false;
  }
  return true;
}

async function requestLibraryPermission() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    showMessage('Necesitamos permiso para acceder a tus fotos');
    return false;
  }
  return true;
}

export async function takePhoto() {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }
  return null;
}

export async function pickFromGallery() {
  const hasPermission = await requestLibraryPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }
  return null;
}