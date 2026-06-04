import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useAppTheme } from '../theme';

// Création d'un composant cliquable animé
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SpaceCardProps {
  title: string;
  description: string;
  iconName: string;
  iconType?: 'Feather' | 'FontAwesome5';
  onPress: () => void;
  colors: any;
}

function SpaceCard({ title, description, iconName, iconType = 'Feather', onPress, colors }: SpaceCardProps) {
  // Valeurs d'animation partagées
  const scale = useSharedValue(1);
  const borderColor = useSharedValue(colors.border);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      borderColor: borderColor.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    borderColor.value = withTiming(colors.primary, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    borderColor.value = withTiming(colors.border, { duration: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: colors.card, shadowColor: colors.foreground === '#ffffff' ? '#000' : colors.foreground },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
        {iconType === 'FontAwesome5' ? (
          <FontAwesome5 name={iconName} size={32} color={colors.primary} />
        ) : (
          <Feather name={iconName as any} size={32} color={colors.primary} />
        )}
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>{description}</Text>
    </AnimatedPressable>
  );
}

export default function ChooseSpace() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* En-tête avec image */}
      <View style={styles.header}>
        <Image
          source={require('../assets/images/login-background-dark.png')}
          style={styles.headerImage}
          resizeMode="contain"
        />
      </View>

      {/* Cartes de sélection */}
      <View style={styles.cardsContainer}>
        <SpaceCard
          title="Espace Étudiant"
          description="Consultez votre emploi du temps et suivez vos absences"
          iconName="graduation-cap"
          iconType="FontAwesome5"
          onPress={() => router.push('/(auth)/student/login')}
          colors={colors}
        />

        <SpaceCard
          title="Espace Professeur"
          description="Gérez les présences et consultez les emplois du temps"
          iconName="briefcase"
          iconType="Feather"
          onPress={() => router.push('/(auth)/professor/login')}
          colors={colors}
        />
      </View>

      {/* Pied de page */}
      <View style={styles.footer}>
        <Text style={[styles.version, { color: colors.mutedForeground }]}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  headerImage: {
    width: 340,
    height: 240,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24, // Espace entre les cartes
  },
  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3, // Ombre pour Android
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  version: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
