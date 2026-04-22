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
import { ArrowLeft, MapPin, Phone, Globe, Users, IndianRupee, Calendar, Award, Hop as Home, ExternalLink, TrendingDown, TrendingUp } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
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
};

type Cutoff = {
  id: string;
  year: number;
  general_rank: number;
  obc_rank: number;
  sc_rank: number;
  st_rank: number;
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
    const [collegeRes, cutoffsRes] = await Promise.all([
      supabase.from('colleges').select('*').eq('id', id).maybeSingle(),
      supabase.from('cutoffs').select('*').eq('college_id', id).order('year', { ascending: false }),
    ]);
    if (collegeRes.data) setCollege(collegeRes.data);
    if (cutoffsRes.data) setCutoffs(cutoffsRes.data);
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
        <Text style={{ color: COLORS.text }}>College not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const latestCutoff = cutoffs[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={22} color={COLORS.text} strokeWidth={2.5} />
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
            <MapPin size={14} color={COLORS.textSecondary} strokeWidth={2} />
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
              <Text style={styles.statLabel}>MBBS Seats</Text>
            </View>
            <View style={styles.statBox}>
              <IndianRupee size={20} color='#D97706' strokeWidth={2} />
              <Text style={styles.statValue}>{formatFee(college.tuition_fee_annual)}</Text>
              <Text style={styles.statLabel}>Tuition Fee</Text>
            </View>
            <View style={styles.statBox}>
              <Home size={20} color='#7C3AED' strokeWidth={2} />
              <Text style={styles.statValue}>{formatFee(college.hostel_fee_annual)}</Text>
              <Text style={styles.statLabel}>Hostel Fee</Text>
            </View>
          </View>

          {/* NEET Cutoffs */}
          {cutoffs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NEET Cutoff Ranks</Text>
              <View style={styles.cutoffTable}>
                <View style={styles.cutoffHeader}>
                  <Text style={styles.cutoffHeaderText}>Year</Text>
                  <Text style={styles.cutoffHeaderText}>General</Text>
                  <Text style={styles.cutoffHeaderText}>OBC</Text>
                  <Text style={styles.cutoffHeaderText}>SC</Text>
                  <Text style={styles.cutoffHeaderText}>ST</Text>
                </View>
                {cutoffs.map((cutoff) => (
                  <View key={cutoff.id} style={styles.cutoffRow}>
                    <Text style={styles.cutoffYear}>{cutoff.year}</Text>
                    <Text style={styles.cutoffRank}>{cutoff.general_rank.toLocaleString()}</Text>
                    <Text style={styles.cutoffRank}>{cutoff.obc_rank.toLocaleString()}</Text>
                    <Text style={styles.cutoffRank}>{cutoff.sc_rank.toLocaleString()}</Text>
                    <Text style={styles.cutoffRank}>{cutoff.st_rank.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.cutoffNote}>* Lower rank = Better (rank 1 is best)</Text>
            </View>
          )}

          {/* Fees Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fee Structure</Text>
            <View style={styles.feeCard}>
              {[
                { label: 'Tuition Fee', value: college.tuition_fee_annual, color: '#D97706' },
                { label: 'Hostel Fee', value: college.hostel_fee_annual, color: '#7C3AED' },
                { label: 'Other Charges', value: college.other_charges, color: '#0EA5E9' },
              ].map((fee) => (
                <View key={fee.label} style={styles.feeRow}>
                  <View style={[styles.feeDot, { backgroundColor: fee.color }]} />
                  <Text style={styles.feeLabel}>{fee.label}</Text>
                  <Text style={styles.feeValue}>
                    {fee.value ? `₹${fee.value.toLocaleString()}/yr` : 'N/A'}
                  </Text>
                </View>
              ))}
              {college.tuition_fee_annual && college.hostel_fee_annual ? (
                <View style={[styles.feeRow, styles.feeTotalRow]}>
                  <Text style={styles.feeTotalLabel}>Total Annual Cost</Text>
                  <Text style={styles.feeTotalValue}>
                    ₹{(college.tuition_fee_annual + college.hostel_fee_annual + (college.other_charges || 0)).toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

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
  collegeName: { fontSize: 20, fontWeight: '700', color: COLORS.text, lineHeight: 28 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  locationText: { fontSize: 13, color: COLORS.textSecondary },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.border, marginHorizontal: 2 },
  accredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: COLORS.primarySurface,
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
    borderColor: COLORS.borderLight,
  },
  statValue: { fontSize: 13, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },

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
  cutoffYear: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  cutoffRank: { flex: 1, fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  cutoffNote: { fontSize: 11, color: COLORS.textLight, marginTop: 6, textAlign: 'center' },

  feeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feeDot: { width: 10, height: 10, borderRadius: 5 },
  feeLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  feeValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  feeTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 0,
  },
  feeTotalLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  feeTotalValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactText: { flex: 1, fontSize: 13, color: COLORS.text },
  noContact: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', paddingVertical: 8 },
});
