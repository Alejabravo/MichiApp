import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import useAccelerometer from '../../hooks/useAccelerometer';
import { spacing, typography, radius, shadows } from '../../theme';

const { width } = Dimensions.get('window');
const MAZE_PADDING = spacing.lg;
const MAZE_SIZE = width - MAZE_PADDING * 2;
const GRID_SIZE = 11;
const TILE = MAZE_SIZE / GRID_SIZE;
const BALL_RADIUS = TILE * 0.32;
const SPEED = 1.4;
const FRICTION = 0.94;

// 1 = pared, 0 = libre, 2 = inicio, 3 = meta
const LEVELS = [
  {
    name: 'Facil',
    grid: [
      '11111111111',
      '12000000001',
      '11111111101',
      '10000000001',
      '10111111101',
      '10100000001',
      '10101111101',
      '10100000001',
      '10111111101',
      '10000000031',
      '11111111111',
    ],
  },
  {
    name: 'Medio',
    grid: [
      '11111111111',
      '12000000001',
      '10111111101',
      '10100000101',
      '10101110101',
      '10101000101',
      '10101111101',
      '10100000001',
      '10111111101',
      '10000000031',
      '11111111111',
    ],
  },
  {
    name: 'Dificil',
    grid: [
      '11111111111',
      '12010010001',
      '10001010101',
      '11101000101',
      '10001110101',
      '10100010001',
      '10111110111',
      '10000010001',
      '10111010101',
      '10000000031',
      '11111111111',
    ],
  },
];

// Verifica si una posicion (px, py) cae en una pared
function isWall(px, py, grid) {
  const col = Math.floor(px / TILE);
  const row = Math.floor(py / TILE);
  if (row < 0 || row >= grid.length) return true;
  if (col < 0 || col >= grid[0].length) return true;
  return grid[row][col] === '1';
}

export default function MazeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { data, available } = useAccelerometer(30);

  const [levelIndex, setLevelIndex] = useState(0);
  const [ballPos, setBallPos] = useState({ x: TILE / 2, y: TILE / 2 });
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);

  const velocity = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const goalPos = useRef({ col: 9, row: 9 });
  const startPos = useRef({ col: 1, row: 1 });
  const wonRef = useRef(false);

  const level = LEVELS[levelIndex];
  const grid = level.grid;

  const styles = createStyles(colors);

  // Reiniciar nivel
  const resetLevel = () => {
    let start = { col: 1, row: 1 };
    let goal = { col: GRID_SIZE - 2, row: GRID_SIZE - 2 };

    grid.forEach((row, ri) => {
      row.split('').forEach((cell, ci) => {
        if (cell === '2') start = { col: ci, row: ri };
        if (cell === '3') goal = { col: ci, row: ri };
      });
    });

    startPos.current = start;
    goalPos.current = goal;

    const sx = start.col * TILE + TILE / 2;
    const sy = start.row * TILE + TILE / 2;

    positionRef.current = { x: sx, y: sy };
    velocity.current = { x: 0, y: 0 };
    setBallPos({ x: sx, y: sy });
    setWon(false);
    wonRef.current = false;
    setTime(0);
    setStarted(false);
  };

  // Reiniciar al cambiar de nivel
  useEffect(() => {
    resetLevel();
  }, [levelIndex]);

  // Cronometro
  useEffect(() => {
    if (!started || won) return;
    const interval = setInterval(() => setTime((v) => v + 0.1), 100);
    return () => clearInterval(interval);
  }, [started, won]);

  // Loop de fisica con el acelerometro
  useEffect(() => {
    if (!available || won || !data) return;

    let frameId;

    const update = () => {
      // Zona muerta: ignorar inclinaciones muy pequenas (evita temblor)
      const deadZone = 0.03;
      const inputX = Math.abs(data.x) < deadZone ? 0 : data.x;
      const inputY = Math.abs(data.y) < deadZone ? 0 : data.y;

      // Aplicar fuerza del acelerometro (amplificada para mejor sensibilidad)
      velocity.current.x += -inputX * SPEED * 2.5;
      velocity.current.y += -inputY * SPEED * 2.5;

      // Friccion
      velocity.current.x *= FRICTION;
      velocity.current.y *= FRICTION;

      // Limitar velocidad maxima
      const maxVel = 8;
      if (velocity.current.x > maxVel) velocity.current.x = maxVel;
      if (velocity.current.x < -maxVel) velocity.current.x = -maxVel;
      if (velocity.current.y > maxVel) velocity.current.y = maxVel;
      if (velocity.current.y < -maxVel) velocity.current.y = -maxVel;

      // Ignorar si es muy pequeno (para que se detenga bien)
      if (Math.abs(velocity.current.x) < 0.05) velocity.current.x = 0;
      if (Math.abs(velocity.current.y) < 0.05) velocity.current.y = 0;

      const pos = positionRef.current;
      const nx = pos.x + velocity.current.x;
      const ny = pos.y + velocity.current.y;

      // Colision en X
      if (isWall(nx, pos.y, grid)) {
        velocity.current.x = -velocity.current.x * 0.4;
      } else {
        pos.x = Math.max(BALL_RADIUS, Math.min(MAZE_SIZE - BALL_RADIUS, nx));
      }

      // Colision en Y
      if (isWall(pos.x, ny, grid)) {
        velocity.current.y = -velocity.current.y * 0.4;
      } else {
        pos.y = Math.max(BALL_RADIUS, Math.min(MAZE_SIZE - BALL_RADIUS, ny));
      }

      setBallPos({ x: pos.x, y: pos.y });

      // Verificar victoria
      const goalX = goalPos.current.col * TILE + TILE / 2;
      const goalY = goalPos.current.row * TILE + TILE / 2;
      const dist = Math.sqrt(
        Math.pow(pos.x - goalX, 2) + Math.pow(pos.y - goalY, 2)
      );

      if (dist < TILE * 0.65 && !wonRef.current) {
        wonRef.current = true;
        setWon(true);
        Vibration.vibrate([0, 150, 80, 150, 80, 300]);
      }

      // Marcar inicio cuando haya movimiento significativo
      if (
        !started &&
        (Math.abs(velocity.current.x) > 0.3 ||
          Math.abs(velocity.current.y) > 0.3)
      ) {
        setStarted(true);
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [data, available, won, grid]);

  const handleNext = () => {
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex(levelIndex + 1);
    } else {
      setLevelIndex(0);
    }
  };

  const handleRestart = () => {
    resetLevel();
  };

  const formatTime = (t) => {
    const min = Math.floor(t / 60);
    const sec = (t % 60).toFixed(1);
    return `${String(min).padStart(2, '0')}:${sec.padStart(4, '0')}`;
  };

  const renderCell = (cell, row, col) => {
    if (cell === '1') {
      return (
        <View
          key={`${row}-${col}`}
          style={[
            styles.wall,
            {
              left: col * TILE,
              top: row * TILE,
              width: TILE,
              height: TILE,
            },
          ]}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laberinto</Text>
        <TouchableOpacity onPress={handleRestart} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={18} color={colors.primary} />
            <Text style={styles.statLabel}>Nivel</Text>
            <Text style={styles.statValue}>
              {levelIndex + 1}/{LEVELS.length}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.statLabel}>Tiempo</Text>
            <Text style={styles.statValue}>{formatTime(time)}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flag-outline" size={18} color={colors.primary} />
            <Text style={styles.statLabel}>Nivel</Text>
            <Text style={styles.statValue}>{level.name}</Text>
          </View>
        </View>

        {/* Laberinto */}
        <View style={styles.mazeWrapper}>
          <View
            style={[
              styles.maze,
              { width: MAZE_SIZE, height: MAZE_SIZE },
            ]}
          >
            {grid.map((row, ri) =>
              row.split('').map((cell, ci) => renderCell(cell, ri, ci))
            )}

            {/* Meta (pez) */}
            <View
              style={[
                styles.goal,
                {
                  left: goalPos.current.col * TILE + TILE / 2 - TILE * 0.4,
                  top: goalPos.current.row * TILE + TILE / 2 - TILE * 0.4,
                  width: TILE * 0.8,
                  height: TILE * 0.8,
                },
              ]}
            >
              <Ionicons name="fish" size={TILE * 0.6} color={colors.success} />
            </View>

            {/* Bolita */}
            <View
              style={[
                styles.ball,
                {
                  left: ballPos.x - BALL_RADIUS,
                  top: ballPos.y - BALL_RADIUS,
                  width: BALL_RADIUS * 2,
                  height: BALL_RADIUS * 2,
                  borderRadius: BALL_RADIUS,
                },
              ]}
            />
          </View>
        </View>

        {/* Overlay de victoria */}
        {won && (
          <View style={styles.wonOverlay}>
            <View style={styles.wonCard}>
              <Ionicons name="trophy" size={50} color={colors.warning} />
              <Text style={styles.wonTitle}>Nivel completado</Text>
              <Text style={styles.wonTime}>{formatTime(time)}</Text>
              <Text style={styles.wonSubtitle}>
                {levelIndex < LEVELS.length - 1
                  ? 'Siguiente nivel desbloqueado'
                  : 'Completaste todos los niveles'}
              </Text>

              <View style={styles.wonActions}>
                <TouchableOpacity
                  style={styles.wonBtnSecondary}
                  onPress={handleRestart}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.wonBtnSecondaryText}>Repetir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.wonBtnPrimary}
                  onPress={handleNext}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={levelIndex < LEVELS.length - 1 ? 'arrow-forward' : 'refresh'}
                    size={18}
                    color={colors.white}
                  />
                  <Text style={styles.wonBtnPrimaryText}>
                    {levelIndex < LEVELS.length - 1 ? 'Siguiente' : 'Reiniciar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Hint */}
        <View style={styles.hintBox}>
          <Ionicons name="pulse-outline" size={18} color={colors.info} />
          <Text style={styles.hintText}>
            Inclina el telefono para llevar la bolita hasta el pez
          </Text>
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
      flex: 1,
      padding: spacing.lg,
      alignItems: 'center',
    },

    // Stats
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.sm,
      alignItems: 'center',
      gap: 2,
      ...shadows.soft,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textLight,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: {
      ...typography.body,
      color: colors.text,
      fontWeight: '700',
    },

    // Laberinto
    mazeWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    maze: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      position: 'relative',
      overflow: 'hidden',
      ...shadows.medium,
    },
    wall: {
      position: 'absolute',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    goal: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ball: {
      position: 'absolute',
      backgroundColor: colors.primary,
      borderWidth: 3,
      borderColor: colors.white,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 4,
    },

    // Overlay victoria
    wonOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    wonCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      alignItems: 'center',
      width: '100%',
      maxWidth: 320,
      ...shadows.medium,
    },
    wonTitle: {
      ...typography.h2,
      color: colors.text,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    wonTime: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.primary,
      marginTop: spacing.xs,
      letterSpacing: 1,
    },
    wonSubtitle: {
      ...typography.bodySmall,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    wonActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
      width: '100%',
    },
    wonBtnSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
    },
    wonBtnSecondaryText: {
      ...typography.button,
      color: colors.primary,
    },
    wonBtnPrimary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
    },
    wonBtnPrimaryText: {
      ...typography.button,
      color: colors.white,
    },

    // Hint
    hintBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      borderRadius: radius.md,
      width: '100%',
      marginTop: 'auto',
    },
    hintText: {
      ...typography.caption,
      color: colors.textLight,
      flex: 1,
      lineHeight: 18,
    },
  });