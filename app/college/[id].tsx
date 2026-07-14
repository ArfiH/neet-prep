import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Phone, Globe, Users, IndianRupee, Award, ExternalLink } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { api } from '@/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type College = {
  id: string;
  name: string;
  state: string;
  city: string;
  type: string;
  total_seats: number;
  tuition_fee_annual: number;
  hostel_fee_annual: number;
  other_charges: number;
  official_website: string;
  contact_phone: string;
  established_year: number;
  accreditation: string;
  facilities: string[];
  image_url: string;
  extra_fees: { label: string; value: number }[];
};

type Cutoff = {
  id: string;
  year: number;
  general_rank: number;
  obc_rank: number;
  sc_rank: number;
  st_rank: number;
  general_marks: number | null;
  obc_marks: number | null;
  sc_marks: number | null;
  st_marks: number | null;
};

const formatFee = (fee: number) => {
  if (!fee) return 'N/A';
  if (fee >= 100000) return `₹${(fee / 100000).toFixed(1)}L/yr`;
  return `₹${fee.toLocaleString()}/yr`;
};

export default function CollegeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [college, setCollege] = useState<College | null>(null);
  const [cutoffs, setCutoffs] = useState<Cutoff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollege();
  }, [id]);

  async function fetchCollege() {
    const collegeData = await api.getCollegeById(id);
    if (collegeData) {
      setCollege(collegeData);
      setCutoffs(collegeData.cutoffs || []);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!college) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <Text style={{ color: COLORS.fg }}>College not found.</Text>
            <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }}>
              <Text style={{ color: COLORS.primary, marginTop: 12 }}>Go back</Text>
            </TouchableOpacity>
          </SafeAreaView>
        );
      }

      const latestCutoff = cutoffs[0];

      return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }}>
        <ArrowLeft size={22} color={COLORS.fg} strokeWidth={2.5} />
      </TouchableOpacity>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: college.image_url || 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={[styles.typeBadge, college.type === 'Government' ? styles.govtBadge : styles.privateBadge]}>
              <Text style={[styles.typeBadgeText, { color: college.type === 'Government' ? COLORS.tagGovt : COLORS.tagPrivate }]}>
                {college.type}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.collegeName}>{college.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color={COLORS.muted} strokeWidth={2} />
            <Text style={styles.locationText}>
              {college.city ? `${college.city}, ` : ''}{college.state}
            </Text>
            {college.established_year > 0 && (
              <>
                <View style={styles.dot} />
                <Text style={styles.locationText}>Est. {college.established_year}</Text>
              </>
            )}
          </View>
          {college.accreditation ? (
            <View style={styles.accredBadge}>
              <Award size={12} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.accredText}>{college.accreditation}</Text>
            </View>
          ) : null}

          {/* Key Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Users size={20} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.statValue}>{college.total_seats || 'N/A'}</Text>
              <Text style={styles.statLabel}>Total Seats</Text>
            </View>
            <View style={styles.statBox}>
              <IndianRupee size={20} color='#D97706' strokeWidth={2} />
              <Text style={styles.statValue}>
                  {formatFee(Math.round(Number(college.tuition_fee_annual || 0)))}
              </Text>
              <Text style={styles.statLabel}>Tuition Fees</Text>
            </View>
          </View>

          {/* NEET Cutoffs */}
          {cutoffs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NEET Cutoff Ranks & Marks</Text>
              <View style={styles.cutoffTable}>
                <View style={styles.cutoffHeader}>
                  <Text style={styles.cutoffHeaderText}>Year</Text>
                  <Text style={styles.cutoffHeaderText}>General</Text>
                  <Text style={styles.cutoffHeaderText}>OBC</Text>
                  <Text style={styles.cutoffHeaderText}>SC</Text>
                  <Text style={styles.cutoffHeaderText}>ST</Text>
                </View>
                {cutoffs.map((cutoff) => (
                  <View key={cutoff.id}>
                    <View style={styles.cutoffRow}>
                      <Text style={styles.cutoffYear}>{cutoff.year}</Text>
                      <Text style={styles.cutoffRank}>
                        {cutoff.general_rank && cutoff.general_rank !== 999999 ? cutoff.general_rank.toLocaleString() : ''}
                      </Text>
                      <Text style={styles.cutoffRank}>
                        {cutoff.obc_rank && cutoff.obc_rank !== 999999 ? cutoff.obc_rank.toLocaleString() : ''}
                      </Text>
                      <Text style={styles.cutoffRank}>
                        {cutoff.sc_rank && cutoff.sc_rank !== 999999 ? cutoff.sc_rank.toLocaleString() : ''}
                      </Text>
                      <Text style={styles.cutoffRank}>
                        {cutoff.st_rank && cutoff.st_rank !== 999999 ? cutoff.st_rank.toLocaleString() : ''}
                      </Text>
                    </View>
                    <View style={styles.cutoffMarksRow}>
                      <Text style={styles.cutoffMarksLabel}>Marks</Text>
                      <Text style={styles.cutoffMarks}>
                        {cutoff.general_marks != null ? cutoff.general_marks : '—'}
                      </Text>
                      <Text style={styles.cutoffMarks}>
                        {cutoff.obc_marks != null ? cutoff.obc_marks : '—'}
                      </Text>
                      <Text style={styles.cutoffMarks}>
                        {cutoff.sc_marks != null ? cutoff.sc_marks : '—'}
                      </Text>
                      <Text style={styles.cutoffMarks}>
                        {cutoff.st_marks != null ? cutoff.st_marks : '—'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Fee Breakdown */}
          {college.tuition_fee_annual > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fee Breakdown</Text>
              <View style={styles.feeCard}>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Tuition Fee</Text>
                  <Text style={styles.feeValue}>₹{Math.round(college.tuition_fee_annual).toLocaleString()}/yr</Text>
                </View>
                {college.hostel_fee_annual > 0 && (
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Hostel Fee</Text>
                    <Text style={styles.feeValue}>₹{Math.round(college.hostel_fee_annual).toLocaleString()}/yr</Text>
                  </View>
                )}
                {college.other_charges > 0 && (
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Other Charges</Text>
                    <Text style={styles.feeValue}>₹{Math.round(college.other_charges).toLocaleString()}/yr</Text>
                  </View>
                )}
                {(college.extra_fees || []).map(f => (
                  <View key={f.label} style={styles.feeRow}>
                    <Text style={styles.feeLabel}>{f.label}</Text>
                    <Text style={styles.feeValue}>₹{Math.round(Number(f.value)).toLocaleString()}/yr</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Links</Text>
            <View style={styles.contactCard}>
              {college.contact_phone ? (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(`tel:${college.contact_phone}`)}
                >
                  <Phone size={16} color={COLORS.primary} strokeWidth={2} />
                  <Text style={styles.contactText}>{college.contact_phone}</Text>
                </TouchableOpacity>
              ) : null}
              {college.official_website ? (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(college.official_website)}
                >
                  <Globe size={16} color={COLORS.primary} strokeWidth={2} />
                  <Text style={[styles.contactText, { color: COLORS.primary }]}>{college.official_website}</Text>
                  <ExternalLink size={13} color={COLORS.primary} strokeWidth={2} />
                </TouchableOpacity>
              ) : null}
              {!college.contact_phone && !college.official_website && (
                <Text style={styles.noContact}>Contact information not available</Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  backBtn: {
    position: 'absolute',
    top: 54,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 12,
    ...SHADOWS.md,
  },

  container: { flex: 1 },

  heroContainer: { height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  heroContent: { position: 'absolute', bottom: 16, left: 16 },

  typeBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  govtBadge: { backgroundColor: '#DBEAFE' },
  privateBadge: { backgroundColor: '#EDE9FE' },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },

  mainCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
  },
  collegeName: { fontSize: 20, fontWeight: '700', color: COLORS.fg, lineHeight: 28 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  locationText: { fontSize: 13, color: COLORS.muted },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.border, marginHorizontal: 2 },
  accredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  accredText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 13, fontWeight: '700', color: COLORS.fg, textAlign: 'center' },
  statLabel: { fontSize: 10, color: COLORS.muted, textAlign: 'center' },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.fg, marginBottom: 12 },

  cutoffTable: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cutoffHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cutoffHeaderText: { flex: 1, fontSize: 11, fontWeight: '700', color: '#fff', textAlign: 'center' },
  cutoffRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cutoffYear: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.fg, textAlign: 'center' },
  cutoffRank: { flex: 1, fontSize: 12, color: COLORS.muted, textAlign: 'center' },
  cutoffMarksRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cutoffMarksLabel: { flex: 1, fontSize: 10, color: COLORS.muted, textAlign: 'center', fontWeight: '600' },
  cutoffMarks: { flex: 1, fontSize: 11, color: COLORS.muted, textAlign: 'center' },
  cutoffNote: { fontSize: 11, color: COLORS.muted, marginTop: 6, textAlign: 'center' },

  feeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feeRow: { flexDirection: 'row', alignItems: 'center' },
  feeLabel: { flex: 1, fontSize: 13, color: COLORS.muted },
  feeValue: { fontSize: 13, fontWeight: '700', color: COLORS.fg },
  feeTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
  },
  feeTotalLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.fg },
  feeTotalValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactText: { flex: 1, fontSize: 13, color: COLORS.fg },
  noContact: { fontSize: 13, color: COLORS.muted, textAlign: 'center', paddingVertical: 8 },
});
