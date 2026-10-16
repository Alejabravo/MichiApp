import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import {
  scheduleDailyReminder,
  cancelReminder,
  getScheduledReminders,
  formatTime,
  requestNotificationPermission,
} from '../../services/notificationsService';
import TimePickerModal from '../../components/common/TimePickerModal';
import { spacing, typography, radius } from '../../theme';

// Presets rapidos (solo nombre + hora sugerida)
const PRESET_TIMES = [
  { hour: 7, minute: 0, label: 'Desayuno' },
  { hour: 12, minute: 30, label: 'Almuerzo' },
  { hour: 18, minute: 0, label: 'Merienda' },
  { hour: 21, minute: 0, label: 'Cena' },
];

export default function RemindersScreen() {
  const { colors } = useTheme();
  const [reminders, setReminders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [initialTime, setInitialTime] = useState({
    hour: 12,
    minute: 0,
    label: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const loadReminders = async () => {
    try {
      const scheduled = await getScheduledReminders();
      setReminders(scheduled);
    } catch (error) {
      console.log('Error cargando recordatorios:', error);
    }
  };

  // Crear con preset
  const handleCreatePreset = async (preset) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    await scheduleDailyReminder(preset.hour, preset.minute, preset.label);
    loadReminders();
  };

  // Crear con hora y label personalizados
  const handleOpenCustom = () => {
    setEditingReminder(null);
    setInitialTime({ hour: 12, minute: 0, label: '' });
    setModalVisible(true);
  };

  // Editar existente
  const handleEditReminder = (reminder) => {
    const trigger = reminder.trigger || {};
    const label = reminder.content?.data?.label || reminder.content?.body || '';

    setEditingReminder(reminder);
    setInitialTime({
      hour: trigger.hour ?? 12,
      minute: trigger.minute ?? 0,
      label,
    });
    setModalVisible(true);
  };

  // Guardar (crear o actualizar)
  const handleSaveTime = async (hour, minute, label) => {
    setModalVisible(false);

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // Si estamos editando, borrar el anterior
    if (editingReminder) {
      await cancelReminder(editingReminder.identifier);
    }

    await scheduleDailyReminder(hour, minute, label || 'Hora de comer');
    setEditingReminder(null);
    loadReminders();
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingReminder(null);
  };

  const handleDeleteReminder = (id) => {
    Alert.alert('Eliminar recordatorio', 'Seguro que quieres eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await cancelReminder(id);
          loadReminders();
        },
      },
    ]);
  };

  const renderReminder = (item) => {
    const trigger = item.trigger || {};
    const hour = trigger.hour ?? 0;
    const minute = trigger.minute ?? 0;
    const timeLabel = formatTime(hour, minute);

    // El label guardado en data, o el body, o el preset, o uno por defecto
    const preset = PRESET_TIMES.find(
      (p) => p.hour === hour && p.minute === minute
    );
    const label =
      item.content?.data?.label ||
      item.content?.body ||
      preset?.label ||
      'Recordatorio';

    return (
      <TouchableOpacity
        key={item.identifier}
        style={styles.reminderCard}
        onPress={() => handleEditReminder(item)}
        activeOpacity={0.7}
      >
        <View style={styles.reminderIcon}>
          <Ionicons name="alarm-outline" size={22} color={colors.primary} />
        </View>

        <View style={styles.reminderInfo}>
          <Text style={styles.reminderTitle} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.reminderTime}>{timeLabel} · Diario</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteReminder(item.identifier)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Recordatorios</Text>
        <Text style={styles.subtitle}>
          Toca uno para editar nombre u hora
        </Text>

        {reminders.length > 0 ? (
          <View style={styles.list}>{reminders.map(renderReminder)}</View>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons
              name="notifications-off-outline"
              size={50}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>Sin recordatorios por ahora</Text>
            <Text style={styles.emptySubtext}>
              Toca una opcion abajo para crear uno
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Agregar rapido</Text>
        <View style={styles.presetsRow}>
          {PRESET_TIMES.map((preset) => (
            <TouchableOpacity
              key={preset.label}
              style={styles.presetBtn}
              onPress={() => handleCreatePreset(preset)}
              activeOpacity={0.7}
            >
              <Text style={styles.presetLabel}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.customBtn}
          onPress={handleOpenCustom}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={22} color={colors.white} />
          <Text style={styles.customBtnText}>Recordatorio personalizado</Text>
        </TouchableOpacity>
      </ScrollView>

      <TimePickerModal
        visible={modalVisible}
        initialHour={initialTime.hour}
        initialMinute={initialTime.minute}
        initialLabel={initialTime.label}
        title={editingReminder ? 'Editar recordatorio' : 'Nuevo recordatorio'}
        onCancel={handleCancel}
        onSave={handleSaveTime}
      />
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
      flexGrow: 1,
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
    list: {
      marginBottom: spacing.md,
    },
    reminderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.sm,
    },
    reminderIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    reminderInfo: {
      flex: 1,
    },
    reminderTitle: {
      ...typography.h3,
      color: colors.text,
    },
    reminderTime: {
      ...typography.bodySmall,
      color: colors.textLight,
    },
    deleteBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      marginBottom: spacing.md,
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
      textAlign: 'center',
    },
    sectionLabel: {
      ...typography.caption,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    presetBtn: {
      width: '48%',
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    presetLabel: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
      paddingVertical: spacing.xs,
    },
    customBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    customBtnText: {
      ...typography.button,
      color: colors.white,
    },
  });