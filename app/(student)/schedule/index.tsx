import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../../../theme';

// ── Types ────────────────────────────────────────────────────────────
interface Course {
  jour: string;
  heureDebut: string;
  heureFin: string;
  module: string;
  professeur: string;
  salle: string;
  type: 'CM' | 'TD' | 'TP';
}

type WeekDay = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';

const ORDERED_DAYS: WeekDay[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// ── Helpers ──────────────────────────────────────────────────────────

/** Renvoie le lundi (00:00) de la semaine contenant `date`. */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dim
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format ISO‑semaine : "2025-W20" */
function toISOWeek(monday: Date): string {
  // Algorithme ISO 8601
  const d = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function formatDay(monday: Date, dayIndex: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayIndex);
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}

function formatWeekRange(monday: Date): string {
  const saturday = new Date(monday);
  saturday.setDate(saturday.getDate() + 5);
  return `Semaine du ${monday.getDate()} au ${saturday.getDate()} ${MOIS[saturday.getMonth()]}`;
}

// ── Badge couleurs par type ──────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  CM: { bg: '#3b82f620', text: '#60a5fa', label: 'Cours magistral' },
  TD: { bg: '#f59e0b20', text: '#fbbf24', label: 'TD' },
  TP: { bg: '#22c55e20', text: '#4ade80', label: 'TP' },
};

// ── Composant CourseCard ─────────────────────────────────────────────
function CourseCard({ course, colors }: { course: Course; colors: any }) {
  const badge = TYPE_COLORS[course.type] ?? TYPE_COLORS.CM;

  return (
    <View style={[styles.courseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Barre latérale de couleur */}
      <View style={[styles.courseAccent, { backgroundColor: badge.text }]} />

      <View style={styles.courseContent}>
        {/* Ligne horaire + badge */}
        <View style={styles.courseTopRow}>
          <View style={styles.timeRow}>
            <Feather name="clock" size={14} color={colors.mutedForeground} />
            <Text style={[styles.courseTime, { color: colors.mutedForeground }]}>
              {course.heureDebut} - {course.heureFin}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Nom du module */}
        <Text style={[styles.courseModule, { color: colors.foreground }]} numberOfLines={2}>
          {course.module}
        </Text>

        {/* Infos prof + salle */}
        <View style={styles.courseInfoRow}>
          <View style={styles.courseInfoItem}>
            <Feather name="user" size={13} color={colors.mutedForeground} />
            <Text style={[styles.courseInfoText, { color: colors.mutedForeground }]}>
              {course.professeur}
            </Text>
          </View>
          <View style={styles.courseInfoItem}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.courseInfoText, { color: colors.mutedForeground }]}>
              {course.salle}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Skeleton loader ──────────────────────────────────────────────────
function SkeletonCard({ colors }: { colors: any }) {
  return (
    <View style={[styles.courseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.courseAccent, { backgroundColor: colors.muted }]} />
      <View style={styles.courseContent}>
        <View style={[styles.skeletonLine, { width: '40%', backgroundColor: colors.muted }]} />
        <View style={[styles.skeletonLine, { width: '75%', height: 16, backgroundColor: colors.muted }]} />
        <View style={[styles.skeletonLine, { width: '55%', backgroundColor: colors.muted }]} />
      </View>
    </View>
  );
}

function SkeletonDay({ colors }: { colors: any }) {
  return (
    <View style={styles.daySection}>
      <View style={[styles.skeletonLine, { width: '35%', height: 18, marginBottom: 12, backgroundColor: colors.muted }]} />
      <SkeletonCard colors={colors} />
      <SkeletonCard colors={colors} />
    </View>
  );
}

// ── Page principale ──────────────────────────────────────────────────
export default function ScheduleScreen() {
  const { colors } = useAppTheme();

  const [filiere, setFiliere] = useState('');
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger la filière depuis le profil stocké
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          setFiliere(user.filiere ?? '');
        }
      } catch {
        // silencieux
      }
    })();
  }, []);

  // ── Données mock pour test ────────────────────────────────────────
  const MOCK_COURSES: Course[] = [
    { jour: 'Lundi',    heureDebut: '08h30', heureFin: '10h30', module: 'Algorithmique avancée',    professeur: 'Pr. Benali',  salle: 'Amphi A',  type: 'CM' },
    { jour: 'Lundi',    heureDebut: '10h30', heureFin: '12h30', module: 'Base de données',          professeur: 'Pr. Tazi',    salle: 'Salle 12', type: 'TD' },
    { jour: 'Mardi',    heureDebut: '08h30', heureFin: '10h30', module: 'Réseaux informatiques',    professeur: 'Pr. Alaoui',  salle: 'Amphi B',  type: 'CM' },
    { jour: 'Mardi',    heureDebut: '14h00', heureFin: '16h00', module: 'Programmation web',        professeur: 'Pr. Fassi',   salle: 'Labo 3',   type: 'TP' },
    { jour: 'Mercredi', heureDebut: '10h30', heureFin: '12h30', module: 'Systèmes distribués',      professeur: 'Pr. Bennani', salle: 'Salle 8',  type: 'TD' },
    { jour: 'Jeudi',    heureDebut: '08h30', heureFin: '10h30', module: 'Algorithmique avancée',    professeur: 'Pr. Benali',  salle: 'Labo 1',   type: 'TP' },
    { jour: 'Jeudi',    heureDebut: '14h00', heureFin: '16h00', module: 'Base de données',          professeur: 'Pr. Tazi',    salle: 'Amphi A',  type: 'CM' },
    { jour: 'Vendredi', heureDebut: '08h30', heureFin: '10h30', module: 'Programmation web',        professeur: 'Pr. Fassi',   salle: 'Salle 12', type: 'TD' },
  ];

  // Charger l'emploi du temps
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError('');

    // Simuler un délai réseau
    await new Promise((r) => setTimeout(r, 600));

    setCourses(MOCK_COURSES);
    setLoading(false);
  }, [monday]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Navigation entre semaines
  const shiftWeek = (delta: number) => {
    const next = new Date(monday);
    next.setDate(next.getDate() + 7 * delta);
    setMonday(next);
  };

  // Grouper les cours par jour
  const grouped: Record<string, Course[]> = {};
  for (const day of ORDERED_DAYS) grouped[day] = [];
  for (const c of courses) {
    if (grouped[c.jour]) grouped[c.jour].push(c);
  }

  // ── Rendu ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ─── Header ─────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Emploi du temps</Text>
        {filiere ? (
          <View style={[styles.filiereBadge, { backgroundColor: colors.primary + '18' }]}>
            <FontIcon name="book-open" size={13} color={colors.primary} />
            <Text style={[styles.filiereText, { color: colors.primary }]}>{filiere}</Text>
          </View>
        ) : null}
      </View>

      {/* ─── Sélecteur de semaine ─ */}
      <View style={[styles.weekSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => shiftWeek(-1)} style={styles.weekArrow}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMonday(getMonday(new Date()))} style={styles.weekLabelContainer}>
          <Feather name="calendar" size={16} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.weekLabel, { color: colors.foreground }]}>{formatWeekRange(monday)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => shiftWeek(1)} style={styles.weekArrow}>
          <Feather name="chevron-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* ─── Contenu ──────────────*/}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <>
            <SkeletonDay colors={colors} />
            <SkeletonDay colors={colors} />
            <SkeletonDay colors={colors} />
          </>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Feather name="wifi-off" size={48} color={colors.mutedForeground} />
            <Text style={[styles.stateTitle, { color: colors.foreground }]}>Erreur de chargement</Text>
            <Text style={[styles.stateMessage, { color: colors.mutedForeground }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchSchedule}
            >
              <Feather name="refresh-cw" size={16} color="#fff" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          ORDERED_DAYS.map((day, idx) => {
            const dayCourses = grouped[day];
            return (
              <View key={day} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayTitle, { color: colors.foreground }]}>{day}</Text>
                  <Text style={[styles.dayDate, { color: colors.mutedForeground }]}>
                    {formatDay(monday, idx)}
                  </Text>
                </View>

                {dayCourses.length > 0 ? (
                  dayCourses.map((course, i) => (
                    <CourseCard key={`${day}-${i}`} course={course} colors={colors} />
                  ))
                ) : (
                  <View style={[styles.emptyDay, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="coffee" size={18} color={colors.mutedForeground} />
                    <Text style={[styles.emptyDayText, { color: colors.mutedForeground }]}>
                      Pas de cours ce jour
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ── Mini‑composant icône (évite un import séparé) ────────────────────
function FontIcon({ name, size, color }: { name: string; size: number; color: string }) {
  return <Feather name={name as any} size={size} color={color} />;
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
    marginBottom: 6,
  },
  filiereBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  filiereText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Week selector */
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  weekArrow: {
    padding: 14,
  },
  weekLabelContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Scroll content */
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  /* Day section */
  daySection: {
    marginBottom: 28,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 8,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dayDate: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* Course card */
  courseCard: {
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
  courseAccent: {
    width: 4,
  },
  courseContent: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  courseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseTime: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseModule: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  courseInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  courseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseInfoText: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* Empty day */
  emptyDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyDayText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* State containers (error / empty global) */
  stateContainer: {
    alignItems: 'center',
    marginTop: 60,
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
    maxWidth: 280,
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

  /* Skeleton */
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
});
