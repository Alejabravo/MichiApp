import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../theme';

export default function TimePickerModal({
  visible,
  initialHour = 12,
  initialMinute = 0,
  initialLabel = '',
  title = 'Elegir hora',
  onCancel,
  onSave,
}) {
  const { colors } = useTheme();
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [label, setLabel] = useState(initialLabel);

  useEffect(() => {
    if (visible) {
      setHour(initialHour);
      setMinute(initialMinute);
      setLabel(initialLabel || '');
    }
  }, [visible, initialHour, initialMinute, initialLabel]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const format = (n) => String(n).padStart(2, '0');

  const styles = createStyles(colors);

  const handleSave = () => {
    onSave(hour, minute, label.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            {/* Preview hora */}
            <View style={styles.preview}>
              <Text style={styles.previewText}>
                {format(hour)}:{format(minute)}
              </Text>
            </View>

            {/* Label personalizado */}
            <Text style={styles.sectionLabel}>Nombre del recordatorio</Text>
            <View style={styles.labelInputWrapper}>
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.textLight}
              />
              <TextInput
                style={styles.labelInput}
                value={label}
                onChangeText={setLabel}
                placeholder="Ej: Darle la pasta, sacarlo a pasear..."
                placeholderTextColor={colors.textMuted}
                maxLength={50}
              />
            </View>

            {/* Selector de horas */}
            <Text style={styles.sectionLabel}>Hora</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
            >
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.chip, hour === h && styles.chipActive]}
                  onPress={() => setHour(h)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      hour === h && styles.chipTextActive,
                    ]}
                  >
                    {format(h)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selector de minutos */}
            <Text style={styles.sectionLabel}>Minutos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
            >
              {minutes.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, minute === m && styles.chipActive]}
                  onPress={() => setMinute(m)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      minute === m && styles.chipTextActive,
                    ]}
                  >
                    {format(m)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Botones */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={onCancel}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnSave]}
                onPress={handleSave}
              >
                <Ionicons name="checkmark" size={20} color={colors.white} />
                <Text style={styles.btnSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h3,
      color: colors.text,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    preview: {
      alignItems: 'center',
      marginBottom: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.lg,
    },
    previewText: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 2,
    },
    sectionLabel: {
      ...typography.caption,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    labelInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    labelInput: {
      flex: 1,
      ...typography.body,
      color: colors.text,
      paddingVertical: spacing.xs,
    },
    row: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    chip: {
      minWidth: 52,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    chipTextActive: {
      color: colors.white,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    btn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
    },
    btnCancel: {
      backgroundColor: colors.surfaceAlt,
    },
    btnCancelText: {
      ...typography.button,
      color: colors.text,
    },
    btnSave: {
      backgroundColor: colors.primary,
    },
    btnSaveText: {
      ...typography.button,
      color: colors.white,
    },
  });