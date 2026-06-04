import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../../../theme';

// ── Types ────────────────────────────────────────────────────────────
interface ProfessorUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  departement?: string;
  matieres?: string[];
}

// ── Composants réutilisables ─────────────────────────────────────────

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconBox, { backgroundColor: colors.primary + '15' }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoTextGroup}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ title, colors }: { title: string; colors: any }) {
  return <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>;
}

// ── Page principale ──────────────────────────────────────────────────
export default function ProfessorProfileScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [user, setUser] = useState<ProfessorUser | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) setUser(JSON.parse(raw));
      } catch { /* silencieux */ }
    })();
  }, []);

  const initials = user
    ? `${(user.prenom?.[0] ?? '').toUpperCase()}${(user.nom?.[0] ?? '').toUpperCase()}`
    : '?';

  const fullName = user ? `${user.prenom} ${user.nom}` : 'Utilisateur';

  const matieresDisplay = user?.matieres?.length
    ? user.matieres.join(', ')
    : '–';

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['token', 'user', 'role']);
            router.replace('/choose-space');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Avatar + Nom ─────────────────────────────────────── */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.fullName, { color: colors.foreground }]}>{fullName}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.primary + '18' }]}>
          <Feather name="briefcase" size={13} color={colors.primary} />
          <Text style={[styles.roleText, { color: colors.primary }]}>Professeur</Text>
        </View>
      </View>

      {/* ─── Carte Infos ──────────────────────────────────────── */}
      <SectionTitle title="INFORMATIONS" colors={colors} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <InfoRow icon="mail"      label="Email"                value={user?.email ?? '–'}        colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow icon="grid"      label="Département"          value={user?.departement ?? '–'}  colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow icon="book-open" label="Matières enseignées"  value={matieresDisplay}            colors={colors} />
      </View>

      {/* ─── Préférences ──────────────────────────────────────── */}
      <SectionTitle title="PRÉFÉRENCES" colors={colors} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.prefRow}>
          <View style={styles.prefLeft}>
            <View style={[styles.infoIconBox, { backgroundColor: colors.primary + '15' }]}>
              <Feather name={isDark ? 'moon' : 'sun'} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.prefLabel, { color: colors.foreground }]}>Thème sombre</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={isDark ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* ─── Compte ───────────────────────────────────────────── */}
      <SectionTitle title="COMPTE" colors={colors} />
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '30' }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Se déconnecter</Text>
      </TouchableOpacity>

      {/* ─── Version ──────────────────────────────────────────── */}
      <Text style={[styles.version, { color: colors.mutedForeground }]}>FSTracker v1.0.0</Text>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  /* Avatar section */
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  fullName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Section title */
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
    marginLeft: 4,
  },

  /* Card */
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  /* Info rows */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },

  /* Preferences */
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  prefLabel: {
    fontSize: 15,
    fontWeight: '600',
  },

  /* Logout */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },

  /* Version */
  version: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
