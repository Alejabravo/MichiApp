import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ToastAndroid,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../context/ThemeContext';
import {
  cancelAllReminders,
  getScheduledReminders,
} from '../../services/notificationsService';
import { spacing, typography, radius } from '../../theme';

const SETTINGS_KEY = '@michiapp_settings';
const CAT_KEY = '@michiapp_cat';

const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  dailyTips: true,
};

export default function SettingsScreen() {
  const { isDark, colors, setDarkMode } = useTheme();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [remindersCount, setRemindersCount] = useState(0);

  useEffect(() => {
    loadSettings();
    loadRemindersCount();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.log('Error cargando ajustes:', error);
    }
  };

  const loadRemindersCount = async () => {
    try {
      const reminders = await getScheduledReminders();
      setRemindersCount(reminders.length);
    } catch (error) {
      console.log('Error cargando recordatorios:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.log('Error guardando ajustes:', error);
    }
  };

  const showFeedback = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('MichiApp', message);
    }
  };

  const toggleNotifications = async (value) => {
    if (!value) {
      Alert.alert(
        'Desactivar notificaciones',
        'Se eliminaran todos los recordatorios programados. Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar',
            style: 'destructive',
            onPress: async () => {
              await cancelAllReminders();
              const updated = { ...settings, notificationsEnabled: false };
              await saveSettings(updated);
              setRemindersCount(0);
              showFeedback('Notificaciones desactivadas');
            },
          },
        ]
      );
    } else {
      const updated = { ...settings, notificationsEnabled: true };
      await saveSettings(updated);
      showFeedback('Notificaciones activadas');
    }
  };

  const toggleDarkMode = async (value) => {
    await setDarkMode(value);
    showFeedback(value ? 'Modo oscuro activado' : 'Modo claro activado');
  };

  const toggleDailyTips = async (value) => {
    const updated = { ...settings, dailyTips: value };
    await saveSettings(updated);
    showFeedback(value ? 'Tips diarios activados' : 'Tips diarios desactivados');
  };

  const handleClearCatData = () => {
    Alert.alert(
      'Borrar perfil del michi',
      'Se eliminaran el nombre, la foto y la edad. Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(CAT_KEY);
            showFeedback('Perfil borrado');
          },
        },
      ]
    );
  };

  const handleClearReminders = () => {
    if (remindersCount === 0) {
      showFeedback('No hay recordatorios activos');
      return;
    }

    Alert.alert(
      'Borrar recordatorios',
      `Se eliminaran ${remindersCount} recordatorio(s). Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await cancelAllReminders();
            setRemindersCount(0);
            showFeedback('Recordatorios eliminados');
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Borrar todos los datos',
      'Se eliminaran el perfil, la foto, los recordatorios y los ajustes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([CAT_KEY, SETTINGS_KEY]);
            await cancelAllReminders();
            setSettings(DEFAULT_SETTINGS);
            setRemindersCount(0);
            showFeedback('Todos los datos fueron borrados');
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          'MichiApp - Cuida a tu michi con recordatorios, sensor y fotos. Descargala ya!',
      });
    } catch (error) {
      console.log('Error compartiendo:', error);
    }
  };

  const handleAbout = () => {
    Alert.alert(
      'Acerca de MichiApp',
      'Version: 1.0.0\n\nAplicacion movil para el cuidado de tu michi.\n\nDesarrollada con React Native y Expo.',
      [{ text: 'Entendido' }]
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ajustes</Text>
        <Text style={styles.subtitle}>Configuracion de la app</Text>

        <Text style={styles.sectionLabel}>Preferencias</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Notificaciones</Text>
                <Text style={styles.rowSubtitle}>
                  {remindersCount} activa(s)
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={isDark ? 'moon' : 'moon-outline'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Modo oscuro</Text>
                <Text style={styles.rowSubtitle}>
                  {isDark ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="bulb-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Tips diarios</Text>
                <Text style={styles.rowSubtitle}>Consejos sobre michis</Text>
              </View>
            </View>
            <Switch
              value={settings.dailyTips}
              onValueChange={toggleDailyTips}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Datos</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleClearCatData}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="paw-outline"
                  size={20}
                  color={colors.warning}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Borrar perfil del michi</Text>
                <Text style={styles.rowSubtitle}>Nombre, foto y edad</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            onPress={handleClearReminders}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="alarm-outline"
                  size={20}
                  color={colors.warning}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Borrar recordatorios</Text>
                <Text style={styles.rowSubtitle}>
                  {remindersCount} programado(s)
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            onPress={handleClearAllData}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.danger}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.danger }]}>
                  Borrar todos los datos
                </Text>
                <Text style={styles.rowSubtitle}>Reiniciar la app</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Informacion</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Compartir app</Text>
                <Text style={styles.rowSubtitle}>Recomienda MichiApp</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            onPress={handleAbout}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Acerca de</Text>
                <Text style={styles.rowSubtitle}>Version 1.0.0</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Ionicons name="heart" size={16} color={colors.primary} />
          <Text style={styles.footerText}>Hecho con amor para los michis</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    title: {
      ...typography.h1,
      color: colors.text,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    sectionLabel: {
      ...typography.caption,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      minHeight: 64,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: spacing.md,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    rowSubtitle: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.md,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.xl,
      paddingVertical: spacing.md,
    },
    footerText: {
      ...typography.caption,
      color: colors.textMuted,
    },
  });