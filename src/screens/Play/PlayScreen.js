import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import useAccelerometer from '../../hooks/useAccelerometer';
import { spacing, typography, radius, shadows } from '../../theme';

// Umbrales mas altos para no activar por accidente
const SHAKE_THRESHOLD = 12;   // antes 4.5 - ahora hay que sacudir MUY fuerte
const TILT_LIGHT = 1.5;
const TILT_MEDIUM = 5;
const MOOD_CHANGE_COOLDOWN = 700;

// Estados del michi (con emojis)
const MOODS = {
  durmiendo: {
    emoji: '😴',
    title: 'Durmiendo',
    subtitle: 'Tu michi esta tranquilo. Mueve el telefono para despertarlo.',
    color: '#B8B5C9',
  },
  tranquilo: {
    emoji: '😺',
    title: 'Tranquilo',
    subtitle: 'Tu michi esta despierto y contento.',
    color: '#A8D5BA',
  },
  curioso: {
    emoji: '😼',
    title: 'Curioso',
    subtitle: 'Tu michi esta atento a lo que pasa.',
    color: '#F4A896',
  },
  sorprendido: {
    emoji: '🙀',
    title: 'Sorprendido',
    subtitle: 'Tu michi se asusto con tanto movimiento.',
    color: '#E89B9B',
  },
};

export default function PlayScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { data, available } = useAccelerometer(50);

  const [mood, setMood] = useState('durmiendo');
  const prevData = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeTime = useRef(0);
  const lastMoodChange = useRef(0);
  const moodRef = useRef('durmiendo');

  useEffect(() => {
    if (!available) return;

    const now = Date.now();

    const dx = Math.abs(data.x - prevData.current.x);
    const dy = Math.abs(data.y - prevData.current.y);
    const dz = Math.abs(data.z - prevData.current.z);
    const delta = dx + dy + dz;

    prevData.current = { x: data.x, y: data.y, z: data.z };

    const tilt = Math.abs(data.x) + Math.abs(data.y);

    // Solo detectar sacudida si es BRUTAL
    if (delta > SHAKE_THRESHOLD) {
      lastShakeTime.current = now;
    }

    let newMood = 'durmiendo';

    if (now - lastShakeTime.current < 600) {
      newMood = 'sorprendido';
    } else if (tilt > TILT_MEDIUM) {
      newMood = 'curioso';
    } else if (tilt > TILT_LIGHT) {
      newMood = 'tranquilo';
    } else {
      newMood = 'durmiendo';
    }

    if (newMood !== moodRef.current && now - lastMoodChange.current > MOOD_CHANGE_COOLDOWN) {
      moodRef.current = newMood;
      lastMoodChange.current = now;
      setMood(newMood);
    }
  }, [data, available]);

  const currentMood = MOODS[mood];
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Sensor</Text>
        <Text style={styles.subtitle}>
          {available
            ? 'Inclina el telefono y mira a tu michi'
            : 'Sensor no disponible en este dispositivo'}
        </Text>

        {available ? (
          <>
            <View style={styles.catWrapper}>
              <View
                style={[
                  styles.catCircle,
                  { borderColor: currentMood.color },
                ]}
              >
                <Text style={styles.catEmoji}>{currentMood.emoji}</Text>
              </View>

              <View
                style={[
                  styles.halo,
                  { backgroundColor: currentMood.color },
                ]}
              />
            </View>

            <View style={styles.moodCard}>
              <View
                style={[
                  styles.moodDot,
                  { backgroundColor: currentMood.color },
                ]}
              />
              <Text style={styles.moodTitle}>{currentMood.title}</Text>
              <Text style={styles.moodSubtitle}>{currentMood.subtitle}</Text>
            </View>
          </>
        ) : (
          <View style={styles.center}>
            <Ionicons
              name="warning-outline"
              size={50}
              color={colors.textMuted}
            />
            <Text style={styles.placeholder}>
              Este dispositivo no tiene acelerometro
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.mazeBtn}
            onPress={() => navigation.navigate('Maze')}
            activeOpacity={0.85}
          >
            <Ionicons name="grid-outline" size={22} color={colors.white} />
            <Text style={styles.mazeBtnText}>Laberinto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.spyBtn}
            onPress={() => navigation.navigate('Spy')}
            activeOpacity={0.85}
          >
            <Ionicons name="eye-outline" size={22} color={colors.white} />
            <Text style={styles.spyBtnText}>Camara espia</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      flex: 1,
      padding: spacing.lg,
      alignItems: 'center',
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
    catWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
      position: 'relative',
    },
    halo: {
      position: 'absolute',
      width: 240,
      height: 240,
      borderRadius: 120,
      opacity: 0.12,
    },
    catCircle: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      ...shadows.medium,
    },
    catEmoji: {
      fontSize: 100,
      lineHeight: 120,
      textAlign: 'center',
    },
    moodCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      alignItems: 'center',
      width: '100%',
      marginBottom: spacing.lg,
      ...shadows.soft,
    },
    moodDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginBottom: spacing.sm,
    },
    moodTitle: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    moodSubtitle: {
      ...typography.bodySmall,
      color: colors.textLight,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: spacing.sm,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    placeholder: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      width: '100%',
      marginTop: 'auto',
    },
    mazeBtn: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    mazeBtnText: {
      ...typography.button,
      color: colors.white,
    },
    spyBtn: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.text,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    spyBtnText: {
      ...typography.button,
      color: colors.background,
    },
  });