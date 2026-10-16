import * as Notifications from 'expo-notifications';
import { Platform, Alert, ToastAndroid } from 'react-native';

// Servicio de notificaciones configurado como ALARMA

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function showMessage(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('MichiApp', message);
  }
}

export async function requestNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    showMessage('Necesitamos permiso para enviar recordatorios');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('michi-alarm', {
      name: 'Recordatorios de comida',
      description: 'Alarmas para alimentar a tu michi',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F4A896',
      // 👇 Sin "sound: 'default'" para evitar el error
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: true,
      enableLights: true,
    });
  }

  return true;
}

export async function scheduleDailyReminder(
  hour,
  minute,
  label = 'Hora de comer'
) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'MichiApp',
      body: label,
      // 👇 Sin "sound" - el canal se encarga del sonido
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 250, 250, 250],
      categoryIdentifier: 'michi-alarm',
    },
    trigger: {
      type: 'daily',
      hour,
      minute,
      repeats: true,
      channelId: 'michi-alarm',
    },
  });

  showMessage(`Recordatorio programado a las ${formatTime(hour, minute)}`);
  return id;
}

export async function cancelReminder(id) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledReminders() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}