import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  ToastAndroid,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../context/ThemeContext';
import useAccelerometer from '../../hooks/useAccelerometer';
import { spacing, typography, radius, shadows } from '../../theme';

const CAPTURES_KEY = '@michiapp_spy_captures';
const MAX_CAPTURES = 20;
const MOTION_THRESHOLD = 0.18; // sensibilidad
const COOLDOWN_MS = 5000; // espera 5s entre capturas

export default function SpyScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { data, available } = useAccelerometer(100);
  const [permission, requestPermission] = useCameraPermissions();

  const [isArmed, setIsArmed] = useState(false);
  const [captures, setCaptures] = useState([]);
  const [lastCapture, setLastCapture] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const cameraRef = useRef(null);
  const baseReading = useRef({ x: 0, y: 0, z: 0 });
  const lastCaptureTime = useRef(0);
  const armedRef = useRef(false);

  const styles = createStyles(colors);

  // Cargar capturas guardadas
  useEffect(() => {
    loadCaptures();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCaptures();
    }, [])
  );

  const loadCaptures = async () => {
    try {
      const saved = await AsyncStorage.getItem(CAPTURES_KEY);
      if (saved) setCaptures(JSON.parse(saved));
    } catch (error) {
      console.log('Error cargando capturas:', error);
    }
  };

  const saveCaptures = async (list) => {
    try {
      await AsyncStorage.setItem(CAPTURES_KEY, JSON.stringify(list));
      setCaptures(list);
    } catch (error) {
      console.log('Error guardando capturas:', error);
    }
  };

  const showFeedback = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('MichiApp', message);
    }
  };

  // 🔥 Capturar foto con la cámara frontal
  const captureIntruder = async () => {
    if (isCapturing) return;
    if (!cameraRef.current) return;

    const now = Date.now();
    if (now - lastCaptureTime.current < COOLDOWN_MS) return;

    lastCaptureTime.current = now;
    setIsCapturing(true);

    try {
      // Vibrar para avisar
      Vibration.vibrate([0, 200, 100, 200]);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      if (photo?.uri) {
        const newCapture = {
          id: Date.now().toString(),
          uri: photo.uri,
          timestamp: new Date().toISOString(),
        };

        const updated = [newCapture, ...captures].slice(0, MAX_CAPTURES);
        await saveCaptures(updated);
        setLastCapture(newCapture);
      }
    } catch (error) {
      console.log('Error capturando:', error);
    }

    setIsCapturing(false);
  };

  // 🚨 Detectar movimiento
  useEffect(() => {
    if (!isArmed || !available) return;

    const dx = Math.abs(data.x - baseReading.current.x);
    const dy = Math.abs(data.y - baseReading.current.y);
    const dz = Math.abs(data.z - baseReading.current.z);
    const totalDiff = dx + dy + dz;

    if (totalDiff > MOTION_THRESHOLD) {
      captureIntruder();
    }
  }, [data, isArmed, available]);

  // Activar / desactivar vigilancia
  const toggleArmed = async () => {
    if (!isArmed) {
      // Pedir permisos de cámara
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          showFeedback('Necesitamos permiso de cámara');
          return;
        }
      }

      // Calibrar con la posición actual
      baseReading.current = { x: data.x, y: data.y, z: data.z };
      lastCaptureTime.current = 0;
      setIsArmed(true);
      armedRef.current = true;
      showFeedback('Vigilancia activada');
    } else {
      setIsArmed(false);
      armedRef.current = false;
      showFeedback('Vigilancia desactivada');
    }
  };

  // Recalibrar
  const recalibrate = () => {
    baseReading.current = { x: data.x, y: data.y, z: data.z };
    lastCaptureTime.current = 0;
    showFeedback('Sensor calibrado');
  };

  // Eliminar captura
  const deleteCapture = (id) => {
    Alert.alert('Eliminar captura', 'Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const updated = captures.filter((c) => c.id !== id);
          await saveCaptures(updated);
          if (lastCapture?.id === id) setLastCapture(null);
        },
      },
    ]);
  };

  // Eliminar todas
  const deleteAll = () => {
    Alert.alert(
      'Eliminar todo',
      'Se borraran todas las capturas guardadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            await saveCaptures([]);
            setLastCapture(null);
          },
        },
      ]
    );
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} · ${hour}:${min}`;
  };

  // 🎨 VISTA: VIGILANCIA ACTIVA
  if (isArmed) {
    return (
      <View style={styles.armedContainer}>
        {/* Cámara oculta pero activa */}
        <CameraView
          ref={cameraRef}
          style={styles.hiddenCamera}
          facing="front"
        />

        <SafeAreaView style={styles.armedContent} edges={['top', 'bottom']}>
          <View style={styles.armedHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.armedTitle}>VIGILANDO</Text>
          </View>

          <View style={styles.armedMiddle}>
            <View style={styles.armedIconWrapper}>
              <Ionicons name="eye" size={80} color={colors.white} />
            </View>
            <Text style={styles.armedText}>
              No muevas el telefono
            </Text>
            <Text style={styles.armedSubtext}>
              Si alguien lo mueve, se capturara una foto automaticamente
            </Text>

            {isCapturing && (
              <View style={styles.capturingBox}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.capturingText}>Capturando...</Text>
              </View>
            )}
          </View>

          <View style={styles.armedFooter}>
            <TouchableOpacity
              style={styles.armedBtnSecondary}
              onPress={recalibrate}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={20} color={colors.white} />
              <Text style={styles.armedBtnSecondaryText}>Calibrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.armedBtnDanger}
              onPress={toggleArmed}
              activeOpacity={0.85}
            >
              <Ionicons name="stop-circle" size={20} color={colors.white} />
              <Text style={styles.armedBtnDangerText}>Detener</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // 🎨 VISTA: CONFIGURACION
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camara Espia</Text>
        {captures.length > 0 ? (
          <TouchableOpacity onPress={deleteAll} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Vigilancia del michi</Text>
        <Text style={styles.subtitle}>
          Detecta cuando alguien mueve el telefono y captura una foto
        </Text>

        {/* Estado del sensor */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons
              name={available ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={available ? colors.success : colors.danger}
            />
            <Text style={styles.statusText}>
              Acelerometro {available ? 'disponible' : 'no disponible'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons
              name={permission?.granted ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={permission?.granted ? colors.success : colors.warning}
            />
            <Text style={styles.statusText}>
              Camara {permission?.granted ? 'permitida' : 'pendiente'}
            </Text>
          </View>
        </View>

        {/* Boton activar */}
        <TouchableOpacity
          style={styles.activateBtn}
          onPress={toggleArmed}
          activeOpacity={0.85}
        >
          <Ionicons name="eye" size={26} color={colors.white} />
          <Text style={styles.activateBtnText}>Activar vigilancia</Text>
        </TouchableOpacity>

        {/* Ultima captura */}
        {lastCapture && (
          <View style={styles.lastCaptureCard}>
            <Text style={styles.sectionLabel}>Ultima captura</Text>
            <Image
              source={{ uri: lastCapture.uri }}
              style={styles.lastCaptureImage}
            />
            <Text style={styles.captureTime}>
              {formatDate(lastCapture.timestamp)}
            </Text>
          </View>
        )}

        {/* Historial */}
        {captures.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              Historial ({captures.length})
            </Text>
            <View style={styles.historyGrid}>
              {captures.map((cap) => (
                <TouchableOpacity
                  key={cap.id}
                  style={styles.historyItem}
                  onLongPress={() => deleteCapture(cap.id)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: cap.uri }}
                    style={styles.historyImage}
                  />
                  <View style={styles.historyTime}>
                    <Text style={styles.historyTimeText} numberOfLines={1}>
                      {formatDate(cap.timestamp)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>
              Manten presionada una captura para eliminarla
            </Text>
          </>
        )}

        {/* Empty state */}
        {captures.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons
              name="camera-outline"
              size={50}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>Sin capturas todavia</Text>
            <Text style={styles.emptySubtext}>
              Activa la vigilancia para empezar
            </Text>
          </View>
        )}

        {/* Aviso */}
        <View style={styles.disclaimer}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.info}
          />
          <Text style={styles.disclaimerText}>
            Coloca el telefono en un lugar firme. Si detecta movimiento, la camara
            frontal tomara una foto automaticamente. Usa esta funcion con respeto.
          </Text>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...typography.h3,
      color: colors.text,
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

    // Status
    statusCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    statusText: {
      ...typography.body,
      color: colors.text,
    },

    // Boton activar
    activateBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: spacing.lg,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
      ...shadows.medium,
    },
    activateBtnText: {
      ...typography.h3,
      color: colors.white,
    },

    // Seccion
    sectionLabel: {
      ...typography.caption,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '700',
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },

    // Ultima captura
    lastCaptureCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.soft,
    },
    lastCaptureImage: {
      width: '100%',
      height: 220,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceAlt,
    },
    captureTime: {
      ...typography.caption,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: spacing.sm,
    },

    // Historial
    historyGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    historyItem: {
      width: '48%',
      marginBottom: spacing.sm,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      ...shadows.soft,
    },
    historyImage: {
      width: '100%',
      height: 140,
      backgroundColor: colors.surfaceAlt,
    },
    historyTime: {
      padding: spacing.xs,
      backgroundColor: colors.surface,
    },
    historyTimeText: {
      ...typography.caption,
      color: colors.textLight,
      textAlign: 'center',
      fontSize: 10,
    },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: spacing.xs,
    },

    // Empty
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    emptyText: {
      ...typography.h3,
      color: colors.textLight,
      marginTop: spacing.md,
    },
    emptySubtext: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },

    // Disclaimer
    disclaimer: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      borderRadius: radius.md,
      marginTop: spacing.md,
    },
    disclaimerText: {
      ...typography.caption,
      color: colors.textLight,
      flex: 1,
      lineHeight: 18,
    },

    // ===== ESTADO ARMADO =====
    armedContainer: {
      flex: 1,
      backgroundColor: '#000000',
    },
    hiddenCamera: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
    },
    armedContent: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'space-between',
    },
    armedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    liveDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#FF3B30',
    },
    armedTitle: {
      ...typography.h2,
      color: '#FFFFFF',
      letterSpacing: 2,
    },
    armedMiddle: {
      alignItems: 'center',
      gap: spacing.md,
    },
    armedIconWrapper: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    armedText: {
      ...typography.h2,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    armedSubtext: {
      ...typography.body,
      color: '#B8B5C9',
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
    capturingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(255,59,48,0.2)',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      marginTop: spacing.md,
    },
    capturingText: {
      ...typography.body,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    armedFooter: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    armedBtnSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    armedBtnSecondaryText: {
      ...typography.button,
      color: '#FFFFFF',
    },
    armedBtnDanger: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: '#FF3B30',
    },
    armedBtnDangerText: {
      ...typography.button,
      color: '#FFFFFF',
    },
  });