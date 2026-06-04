import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../../../theme';

// ── Types ────────────────────────────────────────────────────────────
interface CoursItem {
  heureDebut: string;
  heureFin: string;
  module: string;
  groupe: string;
  salle: string;
  type: 'CM' | 'TD' | 'TP';
}

interface AbsenceItem {
  id: string;
  etudiant: string;
  module: string;
  date: string;
}

interface DashboardStats {
  coursAujourdhui: number;
  totalEtudiants: number;
  absencesMois: number;
  tauxPresence: number;
}

interface DashboardResponse {
  coursAujourdhui: CoursItem[];
  stats: DashboardStats;
  dernieresAbsences: AbsenceItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function todayLabel(): string {
  const d = new Date();
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()].slice(0, 3)}.`;
}

const TYPE_COLORS: Record<string, { color: string; label: string }> = {
  CM: { color: '#60a5fa', label: 'CM' },
  TD: { color: '#fbbf24', label: 'TD' },
  TP: { color: '#4ade80', label: 'TP' },
};

// ── Composants ───────────────────────────────────────────────────────

function StatCard({ icon, value, label, accent, colors }: {
  icon: string; value: string | number; label: string; accent: string; colors: any;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconBox, { backgroundColor: accent + '18' }]}>
        <Feather name={icon as any} size={20} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function CoursCard({ cours, colors }: { cours: CoursItem; colors: any }) {
  const badge = TYPE_COLORS[cours.type] ?? TYPE_COLORS.CM;
  return (
    <View style={[styles.coursCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.coursAccent, { backgroundColor: badge.color }]} />
      <View style={styles.coursContent}>
        <View style={styles.coursTopRow}>
          <View style={styles.coursTimeRow}>
            <Feather name="clock" size={14} color={colors.mutedForeground} />
            <Text style={[styles.coursTime, { color: colors.mutedForeground }]}>
              {cours.heureDebut} - {cours.heureFin}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
        <Text style={[styles.coursModule, { color: colors.foreground }]} numberOfLines={1}>
          {cours.module}
        </Text>
        <View style={styles.coursMetaRow}>
          <View style={styles.metaItem}>
            <Feather name="users" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{cours.groupe}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{cours.salle}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AbsenceMiniCard({ absence, colors }: { absence: AbsenceItem; colors: any }) {
  return (
    <View style={[styles.absenceMini, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.absenceDot, { backgroundColor: colors.destructive }]} />
      <View style={styles.absenceMiniContent}>
        <Text style={[styles.absenceName, { color: colors.foreground }]} numberOfLines={1}>
          {absence.etudiant}
        </Text>
        <Text style={[styles.absenceSub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {absence.module}
        </Text>
      </View>
      <Text style={[styles.absenceDate, { color: colors.mutedForeground }]}>
        {formatShortDate(absence.date)}
      </Text>
    </View>
  );
}

function SectionHeader({ title, icon, colors }: { title: string; icon: string; colors: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Feather name={icon as any} size={18} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

// ── Page principale ──────────────────────────────────────────────────
export default function ProfessorHomeScreen() {
  const { colors } = useAppTheme();

  const [prenom, setPrenom] = useState('');
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger le prénom
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) setPrenom(JSON.parse(raw).prenom ?? '');
      } catch { /* silencieux */ }
    })();
  }, []);

  // ── Données mock pour test ────────────────────────────────────────
  const MOCK_DASHBOARD: DashboardResponse = {
    stats: {
      coursAujourdhui: 3,
      totalEtudiants: 124,
      absencesMois: 18,
      tauxPresence: 87,
    },
    coursAujourdhui: [
      { heureDebut: '08h30', heureFin: '10h30', module: 'Algorithmique avancée',  groupe: 'SMI-S6 Grp A', salle: 'Amphi A',  type: 'CM' },
      { heureDebut: '10h30', heureFin: '12h30', module: 'Base de données',        groupe: 'SMI-S6 Grp B', salle: 'Salle 12', type: 'TD' },
      { heureDebut: '14h00', heureFin: '16h00', module: 'Réseaux informatiques',  groupe: 'SMI-S6 Grp A', salle: 'Labo 3',   type: 'TP' },
    ],
    dernieresAbsences: [
      { id: '1', etudiant: 'Mohamed El Amrani',  module: 'Algorithmique avancée', date: '2025-05-12' },
      { id: '2', etudiant: 'Sara Tazi',          module: 'Base de données',       date: '2025-05-10' },
      { id: '3', etudiant: 'Youssef Alaoui',     module: 'Réseaux informatiques', date: '2025-05-09' },
      { id: '4', etudiant: 'Amina Fassi',        module: 'Algorithmique avancée', date: '2025-05-08' },
    ],
  };

  // Charger le dashboard
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    // Simuler un délai réseau
    await new Promise((r) => setTimeout(r, 600));

    setData(MOCK_DASHBOARD);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Rendu ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Chargement…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="alert-triangle" size={48} color={colors.destructive} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Erreur de chargement</Text>
        <Text style={[styles.errorMsg, { color: colors.mutedForeground }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={fetchDashboard}
        >
          <Feather name="refresh-cw" size={16} color="#fff" />
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = data?.stats;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Greeting ─────────────────────────────────────────── */}
      <View style={styles.greetingSection}>
        <Text style={[styles.greeting, { color: colors.foreground }]}>
          Bonjour, {prenom || 'Professeur'} 👋
        </Text>
        <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{todayLabel()}</Text>
      </View>

      {/* ─── Stats Grid ───────────────────────────────────────── */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="book"
          value={stats?.coursAujourdhui ?? '–'}
          label="Cours aujourd'hui"
          accent={colors.primary}
          colors={colors}
        />
        <StatCard
          icon="users"
          value={stats?.totalEtudiants ?? '–'}
          label="Étudiants"
          accent="#60a5fa"
          colors={colors}
        />
        <StatCard
          icon="user-x"
          value={stats?.absencesMois ?? '–'}
          label="Absences ce mois"
          accent={colors.destructive}
          colors={colors}
        />
        <StatCard
          icon="trending-up"
          value={stats?.tauxPresence != null ? `${stats.tauxPresence}%` : '–'}
          label="Taux de présence"
          accent="#4ade80"
          colors={colors}
        />
      </View>

      {/* ─── Cours aujourd'hui ────────────────────────────────── */}
      <SectionHeader title="Cours aujourd'hui" icon="calendar" colors={colors} />

      {(data?.coursAujourdhui?.length ?? 0) > 0 ? (
        data!.coursAujourdhui.map((cours, i) => (
          <CoursCard key={`cours-${i}`} cours={cours} colors={colors} />
        ))
      ) : (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="coffee" size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Pas de cours aujourd'hui
          </Text>
        </View>
      )}

      {/* ─── Dernières absences ───────────────────────────────── */}
      <SectionHeader title="Dernières absences enregistrées" icon="alert-circle" colors={colors} />

      {(data?.dernieresAbsences?.length ?? 0) > 0 ? (
        data!.dernieresAbsences.map((abs) => (
          <AbsenceMiniCard key={abs.id} absence={abs} colors={colors} />
        ))
      ) : (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="check-circle" size={28} color="#4ade80" />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Aucune absence récente
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  /* Greeting */
  greetingSection: { marginBottom: 28 },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* Stats grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  /* Cours card */
  coursCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  coursAccent: { width: 4 },
  coursContent: { flex: 1, padding: 14, gap: 8 },
  coursTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coursTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coursTime: { fontSize: 13, fontWeight: '600' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  coursModule: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  coursMetaRow: { flexDirection: 'row', gap: 16, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, fontWeight: '500' },

  /* Absence mini card */
  absenceMini: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  absenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  absenceMiniContent: { flex: 1 },
  absenceName: { fontSize: 14, fontWeight: '700' },
  absenceSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  absenceDate: { fontSize: 12, fontWeight: '600' },

  /* Empty box */
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 10,
    marginBottom: 28,
  },
  emptyText: { fontSize: 14, fontWeight: '500' },

  /* Loading / Error */
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: '500' },
  errorTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  errorMsg: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
