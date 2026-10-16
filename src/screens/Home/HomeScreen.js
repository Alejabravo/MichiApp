import { useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useCats } from '../../context/CatContext';
import { calculateDailyPortion, getWeightCategory } from '../../utils/recipes';
import { spacing, typography, radius, shadows } from '../../theme';

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { cats, activeCat, activeCatId, selectCat, addCat, deleteCat } = useCats();

  const styles = createStyles(colors);

  const showFeedback = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('MichiApp', message);
    }
  };

  const handleAddCat = async () => {
    const newCat = await addCat({});
    navigation.navigate('EditCat', { catId: newCat.id, isNew: true });
  };

  const handleEditCat = (cat) => {
    navigation.navigate('EditCat', { catId: cat.id });
  };

  const handleDeleteCat = (cat) => {
    Alert.alert(
      'Eliminar michi',
      `Seguro que quieres eliminar a ${cat.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteCat(cat.id);
            showFeedback('Michi eliminado');
          },
        },
      ]
    );
  };

  const handleRecipes = () => {
    if (!activeCat) {
      showFeedback('Primero agrega un michi');
      return;
    }
    navigation.navigate('Recipes');
  };

  // Vista si no hay michis
  if (cats.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="paw" size={60} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sin michis registrados</Text>
          <Text style={styles.emptySubtitle}>
            Agrega tu primer michi para comenzar
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleAddCat}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={22} color={colors.white} />
            <Text style={styles.primaryBtnText}>Agregar michi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mis Michis</Text>
            <Text style={styles.subtitle}>
              {cats.length} {cats.length === 1 ? 'michi' : 'michis'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={handleAddCat}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Lista de michis */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catsRow}
          style={styles.catsScroll}
        >
          {cats.map((cat) => {
            const isActive = cat.id === activeCatId;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, isActive && styles.catChipActive]}
                onPress={() => selectCat(cat.id)}
                activeOpacity={0.8}
              >
                {cat.photo ? (
                  <Image source={{ uri: cat.photo }} style={styles.catChipPhoto} />
                ) : (
                  <View style={[styles.catChipPhoto, styles.catChipPhotoEmpty]}>
                    <Ionicons name="paw" size={22} color={colors.primary} />
                  </View>
                )}
                <Text
                  style={[
                    styles.catChipName,
                    isActive && styles.catChipNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Perfil activo */}
        {activeCat && (
          <>
            <View style={styles.profileCard}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={() => handleEditCat(activeCat)}
                activeOpacity={0.8}
              >
                {activeCat.photo ? (
                  <Image source={{ uri: activeCat.photo }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="paw" size={50} color={colors.primary} />
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={16} color={colors.white} />
                </View>
              </TouchableOpacity>

              <Text style={styles.catName}>{activeCat.name}</Text>
              {activeCat.breed ? (
                <Text style={styles.catBreed}>{activeCat.breed}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleEditCat(activeCat)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.editBtnText}>Editar perfil</Text>
              </TouchableOpacity>
            </View>

            {/* Datos del michi */}
            <View style={styles.infoGrid}>
              <InfoTile
                colors={colors}
                icon="calendar-outline"
                label="Edad"
                value={activeCat.age || 'Sin datos'}
              />
              <InfoTile
                colors={colors}
                icon="barbell-outline"
                label="Peso"
                value={activeCat.weight ? `${activeCat.weight} kg` : 'Sin datos'}
              />
              <InfoTile
                colors={colors}
                icon="male-female-outline"
                label="Sexo"
                value={activeCat.sex || 'Sin datos'}
              />
              <InfoTile
                colors={colors}
                icon="fitness-outline"
                label="Condicion"
                value={getWeightCategory(activeCat.weight)}
              />
            </View>

            {/* Porcion diaria */}
            {activeCat.weight ? (
              <View style={styles.portionCard}>
                <View style={styles.portionHeader}>
                  <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
                  <Text style={styles.portionTitle}>Porcion diaria recomendada</Text>
                </View>
                {(() => {
                  const p = calculateDailyPortion(activeCat.weight);
                  if (!p) return null;
                  return (
                    <View style={styles.portionBody}>
                      <View style={styles.portionRow}>
                        <Text style={styles.portionLabel}>Comida</Text>
                        <Text style={styles.portionValue}>
                          {p.minGrams} - {p.maxGrams} g
                        </Text>
                      </View>
                      <View style={styles.portionRow}>
                        <Text style={styles.portionLabel}>Comidas al dia</Text>
                        <Text style={styles.portionValue}>{p.mealsPerDay}</Text>
                      </View>
                      <View style={styles.portionRow}>
                        <Text style={styles.portionLabel}>Agua</Text>
                        <Text style={styles.portionValue}>{p.waterMl} ml</Text>
                      </View>
                    </View>
                  );
                })()}
                <Text style={styles.portionNote}>
                  Valores orientativos. Consulta siempre a tu veterinario.
                </Text>
              </View>
            ) : null}

            {/* Boton recetario */}
            <TouchableOpacity
              style={styles.recipesBtn}
              onPress={handleRecipes}
              activeOpacity={0.85}
            >
              <Ionicons name="book-outline" size={22} color={colors.white} />
              <Text style={styles.recipesBtnText}>Ver recetario para {activeCat.name}</Text>
            </TouchableOpacity>

            {/* Boton eliminar */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteCat(activeCat)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteBtnText}>Eliminar {activeCat.name}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoTile({ colors, icon, label, value }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.infoTile}>
      <View style={styles.infoTileIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.infoTileLabel}>{label}</Text>
      <Text style={styles.infoTileValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h1,
      color: colors.text,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textLight,
      marginTop: 2,
    },
    headerAddBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.soft,
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    emptyIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    emptySubtitle: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    primaryBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    primaryBtnText: {
      ...typography.button,
      color: colors.white,
    },

    // Lista horizontal de michis
    catsScroll: {
      marginBottom: spacing.md,
    },
    catsRow: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    catChip: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      minWidth: 90,
    },
    catChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceAlt,
    },
    catChipPhoto: {
      width: 46,
      height: 46,
      borderRadius: 23,
      marginBottom: spacing.xs,
    },
    catChipPhotoEmpty: {
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    catChipName: {
      ...typography.caption,
      color: colors.textLight,
      fontWeight: '600',
      maxWidth: 80,
      textAlign: 'center',
    },
    catChipNameActive: {
      color: colors.primary,
    },

    // Perfil
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.md,
      ...shadows.soft,
    },
    avatarWrapper: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: colors.surface,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.surface,
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.surface,
    },
    catName: {
      ...typography.h2,
      color: colors.text,
      textAlign: 'center',
    },
    catBreed: {
      ...typography.bodySmall,
      color: colors.textLight,
      marginTop: 2,
      textAlign: 'center',
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceAlt,
    },
    editBtnText: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: '600',
    },

    // Grid de datos
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    infoTile: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.soft,
    },
    infoTileIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    infoTileLabel: {
      ...typography.caption,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    infoTileValue: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },

    // Porcion diaria
    portionCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.soft,
    },
    portionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    portionTitle: {
      ...typography.h3,
      color: colors.text,
      flex: 1,
    },
    portionBody: {
      gap: spacing.xs,
    },
    portionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    portionLabel: {
      ...typography.body,
      color: colors.textLight,
    },
    portionValue: {
      ...typography.body,
      color: colors.text,
      fontWeight: '700',
    },
    portionNote: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.sm,
      fontStyle: 'italic',
      textAlign: 'center',
    },

    // Boton recetario
    recipesBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
      ...shadows.soft,
    },
    recipesBtnText: {
      ...typography.button,
      color: colors.white,
    },

    // Boton eliminar
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
    },
    deleteBtnText: {
      ...typography.bodySmall,
      color: colors.danger,
      fontWeight: '600',
    },
  });