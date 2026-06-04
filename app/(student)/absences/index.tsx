import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../../../theme';

// ── Types ────────────────────────────────────────────────────────────
type AbsenceStatus = 'justifiée' | 'non_justifiée' | 'en_attente';

interface Absence {
  id: string;
  date: string;        // ISO date string
  module: string;
  professeur: string;
  heureDebut: string;
  heureFin: string;
  statut: AbsenceStatus;
  motif?: string;
}

interface AbsencesResponse {
  total: number;
  justifiees: number;
  nonJustifiees: number;
  tauxAssiduite: number;
  absences: Absence[];
}

type FilterTab = 'all' | 'justifiée' | 'non_justifiée';

// ── Helpers ──────────────────────────────────────────────────────────
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_CONFIG: Record<AbsenceStatus, { label: string; color: string; bg: string; icon: string }> = {
  'justifiée': { label: 'Justifiée', color: '#4ade80', bg: '#22c55e18', icon: 'check-circle' },
  'non_justifiée': { label: 'Non justifiée', color: '#f87171', bg: '#ef444418', icon: 'x-circle' },
  'en_attente': { label: 'En attente', color: '#fbbf24', bg: '#f59e0b18', icon: 'clock' },
};

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'justifiée', label: 'Justifiées' },
  { key: 'non_justifiée', label: 'Non justifiées' },
];

// ── Composants ───────────────────────────────────────────────────────

function SummaryCard({ colors, data }: { colors: any; data: AbsencesResponse | null }) {
  const items = [
    { label: 'Total', value: data?.total ?? '–', icon: 'list', accent: colors.primary },
    { label: 'Justifiées', value: data?.justifiees ?? '–', icon: 'check-circle', accent: '#4ade80' },
    { label: 'Non justifiées', value: data?.nonJustifiees ?? '–', icon: 'x-circle', accent: '#f87171' },
  ];

  const taux = data ? `${data.tauxAssiduite}%` : '–';

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Taux d'assiduité - cercle principal */}
      <View style={styles.tauxRow}>
        <View style={[styles.tauxCircle, { borderColor: colors.primary }]}>
          <Text style={[styles.tauxValue, { color: colors.primary }]}>{taux}</Text>
          <Text style={[styles.tauxLabel, { color: colors.mutedForeground }]}>Assiduité</Text>
        </View>
      </View>

      {/* Compteurs */}
      <View style={styles.countersRow}>
        {items.map((item) => (
          <View key={item.label} style={styles.counterItem}>
            <Feather name={item.icon as any} size={18} color={item.accent} />
            <Text style={[styles.counterValue, { color: colors.foreground }]}>{item.value}</Text>
            <Text style={[styles.counterLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AbsenceItem({ absence, colors }: { absence: Absence; colors: any }) {
  const status = STATUS_CONFIG[absence.statut] ?? STATUS_CONFIG['en_attente'];

  return (
    <View style={[styles.absenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Barre latérale */}
      <View style={[styles.absenceAccent, { backgroundColor: status.color }]} />

      <View style={styles.absenceContent}>
        {/* Date */}
        <Text style={[styles.absenceDate, { color: colors.foreground }]}>
          {formatDate(absence.date)}
        </Text>

        {/* Module + Prof */}
        <Text style={[styles.absenceModule, { color: colors.foreground }]} numberOfLines={1}>
          {absence.module}
        </Text>
        <View style={styles.absenceMetaRow}>
          <View style={styles.metaItem}>
            <Feather name="user" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{absence.professeur}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {absence.heureDebut} - {absence.heureFin}
            </Text>
          </View>
        </View>

        {/* Badge statut */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Feather name={status.icon as any} size={13} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Motif si justifiée */}
        {absence.statut === 'justifiée' && absence.motif ? (
          <Text style={[styles.motif, { color: colors.mutedForeground }]} numberOfLines={2}>
            Motif : {absence.motif}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Page principale ──────────────────────────────────────────────────
export default function AbsencesScreen() {
  const { colors } = useAppTheme();

  const [data, setData] = useState<AbsencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  // ── Données mock pour test ────────────────────────────────────────
  const MOCK_DATA: AbsencesResponse = {
    total: 5,
    justifiees: 2,
    nonJustifiees: 2,
    tauxAssiduite: 92,
    absences: [
      {
        id: '1',
        date: '2025-05-12',
        module: 'Algorithmique avancée',
        professeur: 'Pr. Benali',
        heureDebut: '08h30',
        heureFin: '10h30',
        statut: 'justifiée',
        motif: 'Rendez-vous médical',
      },
      {
        id: '2',
        date: '2025-05-08',
        module: 'Base de données',
        professeur: 'Pr. Tazi',
        heureDebut: '10h30',
        heureFin: '12h30',
        statut: 'non_justifiée',
      },
      {
        id: '3',
        date: '2025-05-05',
        module: 'Réseaux informatiques',
        professeur: 'Pr. Alaoui',
        heureDebut: '14h00',
        heureFin: '16h00',
        statut: 'en_attente',
      },
      {
        id: '4',
        date: '2025-04-28',
        module: 'Programmation web',
        professeur: 'Pr. Fassi',
        heureDebut: '08h30',
        heureFin: '10h30',
        statut: 'justifiée',
        motif: 'Convocation administrative',
      },
      {
        id: '5',
        date: '2025-04-22',
        module: 'Systèmes distribués',
        professeur: 'Pr. Bennani',
        heureDebut: '10h30',
        heureFin: '12h30',
        statut: 'non_justifiée',
      },
    ],
  };

  const fetchAbsences = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');

    // Simuler un délai réseau
    await new Promise((r) => setTimeout(r, 600));

    setData(MOCK_DATA);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  // Filtrer les absences
  const filteredAbsences = (data?.absences ?? []).filter((a) => {
    if (filter === 'all') return true;
    return a.statut === filter;
  });

  // ── Header de la FlatList (summary + filtres) ──────────────────────
  const ListHeader = () => (
    <View>
      <SummaryCard colors={colors} data={data} />

      {/* Filtres horizontaux */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: active ? '#ffffff' : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── Empty state ────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.stateContainer}>
      <Feather name="smile" size={48} color={colors.mutedForeground} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Aucune absence</Text>
      <Text style={[styles.stateMessage, { color: colors.mutedForeground }]}>
        {filter === 'all'
          ? "Vous n'avez aucune absence enregistrée. Continuez comme ça !"
          : 'Aucune absence ne correspond à ce filtre.'}
      </Text>
    </View>
  );

  // ── Rendu ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mes absences</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Chargement…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Feather name="alert-triangle" size={48} color={colors.destructive} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Erreur de chargement</Text>
          <Text style={[styles.stateMessage, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => fetchAbsences()}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredAbsences}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AbsenceItem absence={item} colors={colors} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAbsences(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  /* Header */
  header: {
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  /* Summary card */
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  tauxRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tauxCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tauxValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  tauxLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  counterItem: {
    alignItems: 'center',
    gap: 4,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  counterLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Filters */
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* List */
  listContent: {
    paddingBottom: 100,
  },

  /* Absence card */
  absenceCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  absenceAccent: {
    width: 4,
  },
  absenceContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  absenceDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  absenceModule: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  absenceMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  motif: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 2,
  },

  /* States */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stateContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  stateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
