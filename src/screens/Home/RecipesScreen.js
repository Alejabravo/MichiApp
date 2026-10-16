import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useCats } from '../../context/CatContext';
import {
  RECIPES,
  SNACKS,
  FORBIDDEN,
  calculateDailyPortion,
} from '../../utils/recipes';
import { spacing, typography, radius, shadows } from '../../theme';

export default function RecipesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { activeCat } = useCats();
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState('recipes');

  const styles = createStyles(colors);
  const portion = activeCat?.weight
    ? calculateDailyPortion(activeCat.weight)
    : null;

  const toggle = (id) => setExpandedId(expandedId === id ? null : id);

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
        <Text style={styles.headerTitle}>Recetario</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Card del michi */}
        {activeCat && (
          <View style={styles.catCard}>
            <Ionicons name="paw" size={22} color={colors.primary} />
            <View style={styles.catCardInfo}>
              <Text style={styles.catCardName}>{activeCat.name}</Text>
              <Text style={styles.catCardDetail}>
                {activeCat.weight ? `${activeCat.weight} kg` : 'Sin peso registrado'}
              </Text>
            </View>
          </View>
        )}

        {/* Porcion diaria destacada */}
        {portion && (
          <View style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>PORCION DIARIA SUGERIDA</Text>
            <Text style={styles.highlightValue}>
              {portion.minGrams} - {portion.maxGrams} g
            </Text>
            <Text style={styles.highlightDetail}>
              Dividida en {portion.mealsPerDay} comidas al dia
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'recipes' && styles.tabActive]}
            onPress={() => setTab('recipes')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'recipes' && styles.tabTextActive,
              ]}
            >
              Recetas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'snacks' && styles.tabActive]}
            onPress={() => setTab('snacks')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'snacks' && styles.tabTextActive,
              ]}
            >
              Snacks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'forbidden' && styles.tabActive]}
            onPress={() => setTab('forbidden')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'forbidden' && styles.tabTextActive,
              ]}
            >
              Prohibidos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido segun tab */}
        {tab === 'recipes' && (
          <>
            {RECIPES.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                expanded={expandedId === recipe.id}
                onToggle={() => toggle(recipe.id)}
                colors={colors}
              />
            ))}
          </>
        )}

        {tab === 'snacks' && (
          <>
            {SNACKS.map((snack) => (
              <View key={snack.id} style={styles.snackCard}>
                <View style={styles.snackIconWrapper}>
                  <Ionicons name="star" size={20} color={colors.success} />
                </View>
                <View style={styles.snackInfo}>
                  <Text style={styles.snackTitle}>{snack.title}</Text>
                  <Text style={styles.snackDescription}>{snack.description}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'forbidden' && (
          <View style={styles.forbiddenCard}>
            <View style={styles.forbiddenHeader}>
              <Ionicons name="warning" size={26} color={colors.danger} />
              <Text style={styles.forbiddenTitle}>Alimentos prohibidos</Text>
            </View>
            <Text style={styles.forbiddenSubtitle}>
              Nunca le des estos alimentos a tu michi
            </Text>
            {FORBIDDEN.map((item) => (
              <View key={item} style={styles.forbiddenItem}>
                <Ionicons name="close-circle" size={18} color={colors.danger} />
                <Text style={styles.forbiddenItemText}>{item}</Text>
              </View>
            ))}
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
            Estas recetas son orientativas. Consulta siempre con tu veterinario antes de
            cambiar la alimentacion de tu michi.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecipeCard({ recipe, expanded, onToggle, colors }) {
  const styles = createStyles(colors);
  return (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={styles.recipeHeader}>
        <View style={styles.recipeIconWrapper}>
          <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.recipeHeaderInfo}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <Text style={styles.recipeMeta}>
            {recipe.category} · {recipe.prepTime}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textLight}
        />
      </View>

      {expanded && (
        <View style={styles.recipeBody}>
          <Text style={styles.recipeSectionTitle}>Ingredientes</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.recipeLine}>
              <View style={styles.bullet} />
              <Text style={styles.recipeLineText}>{ing}</Text>
            </View>
          ))}

          <Text style={styles.recipeSectionTitle}>Preparacion</Text>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.recipeLine}>
              <Text style={styles.stepNumber}>{i + 1}.</Text>
              <Text style={styles.recipeLineText}>{step}</Text>
            </View>
          ))}

          <View style={styles.recipeTipBox}>
            <Ionicons name="bulb-outline" size={16} color={colors.warning} />
            <Text style={styles.recipeTipText}>{recipe.tip}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
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

    // Card del michi
    catCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
    },
    catCardInfo: {
      flex: 1,
    },
    catCardName: {
      ...typography.h3,
      color: colors.text,
    },
    catCardDetail: {
      ...typography.bodySmall,
      color: colors.textLight,
    },

    // Porcion destacada
    highlightCard: {
      backgroundColor: colors.primary,
      padding: spacing.lg,
      borderRadius: radius.xl,
      alignItems: 'center',
      marginBottom: spacing.md,
      ...shadows.medium,
    },
    highlightLabel: {
      ...typography.caption,
      color: colors.white,
      opacity: 0.9,
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    highlightValue: {
      fontSize: 34,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: -0.5,
    },
    highlightDetail: {
      ...typography.bodySmall,
      color: colors.white,
      opacity: 0.9,
      marginTop: spacing.xs,
    },

    // Tabs
    tabsRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      padding: 4,
      marginBottom: spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: radius.pill,
    },
    tabActive: {
      backgroundColor: colors.surface,
      ...shadows.soft,
    },
    tabText: {
      ...typography.bodySmall,
      color: colors.textLight,
      fontWeight: '600',
    },
    tabTextActive: {
      color: colors.primary,
    },

    // Recipe card
    recipeCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.soft,
    },
    recipeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    recipeIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recipeHeaderInfo: {
      flex: 1,
    },
    recipeTitle: {
      ...typography.h3,
      color: colors.text,
    },
    recipeMeta: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: 2,
    },
    recipeBody: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    recipeSectionTitle: {
      ...typography.caption,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '700',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    recipeLine: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: 6,
      paddingRight: spacing.sm,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 8,
    },
    stepNumber: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: '700',
      minWidth: 20,
    },
    recipeLineText: {
      ...typography.bodySmall,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },
    recipeTipBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginTop: spacing.sm,
    },
    recipeTipText: {
      ...typography.caption,
      color: colors.textLight,
      flex: 1,
      fontStyle: 'italic',
    },

    // Snacks
    snackCard: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.sm,
      ...shadows.soft,
    },
    snackIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    snackInfo: {
      flex: 1,
    },
    snackTitle: {
      ...typography.h3,
      color: colors.text,
    },
    snackDescription: {
      ...typography.bodySmall,
      color: colors.textLight,
      marginTop: 2,
      lineHeight: 20,
    },

    // Prohibidos
    forbiddenCard: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.danger,
      ...shadows.soft,
    },
    forbiddenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    forbiddenTitle: {
      ...typography.h3,
      color: colors.danger,
    },
    forbiddenSubtitle: {
      ...typography.bodySmall,
      color: colors.textLight,
      marginBottom: spacing.md,
    },
    forbiddenItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 6,
    },
    forbiddenItemText: {
      ...typography.body,
      color: colors.text,
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
  });