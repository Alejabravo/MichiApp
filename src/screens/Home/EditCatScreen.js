import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useCats } from '../../context/CatContext';
import { takePhoto, pickFromGallery } from '../../services/imageService';
import { spacing, typography, radius, shadows } from '../../theme';

export default function EditCatScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { catId } = route.params || {};

  const { cats, updateCat } = useCats();
  const existing = cats.find((c) => c.id === catId);

  const [form, setForm] = useState({
    name: '',
    photo: null,
    age: '',
    weight: '',
    breed: '',
    sex: 'Hembra',
    birthdate: '',
    chip: '',
    notes: '',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        photo: existing.photo || null,
        age: existing.age || '',
        weight: existing.weight || '',
        breed: existing.breed || '',
        sex: existing.sex || 'Hembra',
        birthdate: existing.birthdate || '',
        chip: existing.chip || '',
        notes: existing.notes || '',
      });
    }
  }, [catId]);

  const styles = createStyles(colors);

  const showFeedback = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('MichiApp', message);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert('Foto del michi', 'De donde quieres tomar la foto?', [
      { text: 'Camara', onPress: pickCamera },
      { text: 'Galeria', onPress: pickGallery },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const pickCamera = async () => {
    const uri = await takePhoto();
    if (uri) setForm((f) => ({ ...f, photo: uri }));
  };

  const pickGallery = async () => {
    const uri = await pickFromGallery();
    if (uri) setForm((f) => ({ ...f, photo: uri }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showFeedback('El nombre es obligatorio');
      return;
    }

    await updateCat(catId, form);
    showFeedback('Perfil guardado');
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (!existing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Michi no encontrado</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar michi</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
          <Ionicons name="checkmark" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Foto */}
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handleChangePhoto}
          activeOpacity={0.85}
        >
          {form.photo ? (
            <Image source={{ uri: form.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="paw" size={48} color={colors.primary} />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={18} color={colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.hint}>Toca la foto para cambiarla</Text>

        {/* Formulario */}
        <Field
          colors={colors}
          label="Nombre"
          icon="paw-outline"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
          placeholder="Ej: Michi"
          required
        />

        <Field
          colors={colors}
          label="Raza"
          icon="ribbon-outline"
          value={form.breed}
          onChangeText={(v) => setForm({ ...form, breed: v })}
          placeholder="Ej: Criollo, Siames, Persa"
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Field
              colors={colors}
              label="Edad"
              icon="calendar-outline"
              value={form.age}
              onChangeText={(v) => setForm({ ...form, age: v })}
              placeholder="Ej: 2 anos"
            />
          </View>
          <View style={styles.rowItem}>
            <Field
              colors={colors}
              label="Peso (kg)"
              icon="barbell-outline"
              value={form.weight}
              onChangeText={(v) =>
                setForm({ ...form, weight: v.replace(/[^0-9.]/g, '') })
              }
              placeholder="Ej: 4.5"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Sexo */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldHeader}>
            <Ionicons
              name="male-female-outline"
              size={18}
              color={colors.textLight}
            />
            <Text style={styles.fieldLabel}>Sexo</Text>
          </View>
          <View style={styles.sexRow}>
            {['Hembra', 'Macho'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.sexOption,
                  form.sex === opt && styles.sexOptionActive,
                ]}
                onPress={() => setForm({ ...form, sex: opt })}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.sexOptionText,
                    form.sex === opt && styles.sexOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Field
          colors={colors}
          label="Fecha de nacimiento"
          icon="gift-outline"
          value={form.birthdate}
          onChangeText={(v) => setForm({ ...form, birthdate: v })}
          placeholder="DD/MM/AAAA"
        />

        <Field
          colors={colors}
          label="Numero de chip"
          icon="card-outline"
          value={form.chip}
          onChangeText={(v) => setForm({ ...form, chip: v })}
          placeholder="Opcional"
        />

        {/* Notas */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldHeader}>
            <Ionicons
              name="document-text-outline"
              size={18}
              color={colors.textLight}
            />
            <Text style={styles.fieldLabel}>Notas</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.notes}
            onChangeText={(v) => setForm({ ...form, notes: v })}
            placeholder="Alergias, gustos, cuidados especiales..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={22} color={colors.white} />
          <Text style={styles.saveBtnText}>Guardar cambios</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  colors,
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  required,
}) {
  const styles = createStyles(colors);
  return (
    <View style={styles.fieldWrapper}>
      <View style={styles.fieldHeader}>
        <Ionicons name={icon} size={18} color={colors.textLight} />
        <Text style={styles.fieldLabel}>
          {label} {required ? <Text style={{ color: colors.danger }}>*</Text> : null}
        </Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    errorText: {
      ...typography.h3,
      color: colors.textLight,
      marginBottom: spacing.md,
    },
    backBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
    },
    backBtnText: {
      ...typography.button,
      color: colors.white,
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
    avatarWrapper: {
      alignSelf: 'center',
      position: 'relative',
      marginBottom: spacing.sm,
    },
    avatar: {
      width: 130,
      height: 130,
      borderRadius: 65,
      borderWidth: 4,
      borderColor: colors.surface,
    },
    avatarPlaceholder: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.surface,
    },
    cameraBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.surface,
    },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    fieldWrapper: {
      marginBottom: spacing.md,
    },
    fieldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    fieldLabel: {
      ...typography.caption,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '600',
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      ...typography.body,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 90,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    rowItem: {
      flex: 1,
    },
    sexRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    sexOption: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
    },
    sexOptionActive: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.primary,
    },
    sexOptionText: {
      ...typography.body,
      color: colors.textLight,
      fontWeight: '600',
    },
    sexOptionTextActive: {
      color: colors.primary,
    },
    saveBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      ...shadows.soft,
    },
    saveBtnText: {
      ...typography.button,
      color: colors.white,
    },
  });