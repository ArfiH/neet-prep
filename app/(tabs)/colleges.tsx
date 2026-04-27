import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { GraduationCap, Search, ChevronRight, TrendingUp, Award } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { api } from '@/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type PredictedCollege = {
  id: string;
  name: string;
  state: string;
  city: string;
  type: string;
  image_url: string;
  tuition_fee_annual: number;
  total_seats: number;
  cutoff_rank: number;
  probability: number;
  rank_diff: number;
};

const CATEGORIES = ['General', 'OBC', 'SC', 'ST'];
const STATES = [
  'All India', 'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Puducherry',
];

function getProbability(rank: number, cutoffRank: number): number {
  if (rank <= cutoffRank) return 0.95;
  if (rank <= cutoffRank + 5000) return 0.70;
  if (rank <= cutoffRank + 15000) return 0.40;
  if (rank <= cutoffRank + 30000) return 0.15;
  return 0;
}

export default function CollegesScreen() {
  const router = useRouter();
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('General');
  const [state, setState] = useState('All India');
  const [results, setResults] = useState<PredictedCollege[]>([]);
  const [loading, setLoading] = useState(false);
  const [predicted, setPredicted] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const categoryColumn: Record<string, string> = {
    General: 'general_rank',
    OBC: 'obc_rank',
    SC: 'sc_rank',
    ST: 'st_rank',
  };

  async function predict() {
    if (!rank || isNaN(Number(rank))) return;
    setLoading(true);
    setPredicted(false);

    const userRank = parseInt(rank);
    const predictions = await api.predictColleges(userRank, category, state);

    setResults(predictions);
    setLoading(false);
    setPredicted(true);
  }

  const filteredStates = STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()));

  const probabilityColor = (p: number) => {
    if (p >= 0.9) return '#16A34A';
    if (p >= 0.6) return '#D97706';
    return '#EF4444';
  };

  const probabilityLabel = (p: number) => {
    if (p >= 0.9) return 'High';
    if (p >= 0.6) return 'Medium';
    return 'Low';
  };

  const renderResult = ({ item }: { item: PredictedCollege }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push(`/college/${item.id}` as any)}
      activeOpacity={0.88}
    >
      <Image
        source={{ uri: item.image_url || 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg' }}
        style={styles.resultImage}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.resultLocation}>{item.city ? `${item.city}, ` : ''}{item.state}</Text>
        <View style={styles.resultMeta}>
          <View style={[styles.typeBadge, item.type === 'Government' ? styles.govtBadge : styles.privateBadge]}>
            <Text style={[styles.typeBadgeText, { color: item.type === 'Government' ? COLORS.tagGovt : COLORS.tagPrivate }]}>
              {item.type}
            </Text>
          </View>
          <Text style={styles.cutoffText}>Cutoff: {item.cutoff_rank.toLocaleString()}</Text>
        </View>
        <View style={styles.probabilityRow}>
          <View style={[styles.probBadge, { backgroundColor: probabilityColor(item.probability) + '20' }]}>
            <Text style={[styles.probText, { color: probabilityColor(item.probability) }]}>
              {probabilityLabel(item.probability)} Chance
            </Text>
          </View>
          <Text style={styles.rankDiff}>
            {item.rank_diff >= 0 ? `+${item.rank_diff.toLocaleString()} margin` : `${Math.abs(item.rank_diff).toLocaleString()} above cutoff`}
          </Text>
        </View>
      </View>
      <ChevronRight size={16} color={COLORS.textLight} strokeWidth={2} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>College Predictor</Text>
        <Text style={styles.headerSubtitle}>Find colleges based on your NEET rank</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Prediction Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Enter Your Details</Text>

          {/* Rank Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NEET Rank</Text>
            <TextInput
              style={styles.rankInput}
              placeholder="e.g. 15000"
              placeholderTextColor={COLORS.textLight}
              value={rank}
              onChangeText={setRank}
              keyboardType="number-pad"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.pillRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, category === cat && styles.catPillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* State */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>State Preference</Text>
            <TouchableOpacity
              style={styles.stateSelector}
              onPress={() => setShowStateDropdown(!showStateDropdown)}
            >
              <Text style={styles.stateSelectorText}>{state}</Text>
              <ChevronRight size={16} color={COLORS.textSecondary} style={{ transform: [{ rotate: showStateDropdown ? '-90deg' : '90deg' }] }} />
            </TouchableOpacity>
            {showStateDropdown && (
              <View style={styles.stateDropdown}>
                <TextInput
                  style={styles.stateSearch}
                  placeholder="Search state..."
                  placeholderTextColor={COLORS.textLight}
                  value={stateSearch}
                  onChangeText={setStateSearch}
                />
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {filteredStates.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.stateOption, state === s && styles.stateOptionActive]}
                      onPress={() => { setState(s); setShowStateDropdown(false); setStateSearch(''); }}
                    >
                      <Text style={[styles.stateOptionText, state === s && styles.stateOptionTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.predictBtn, (!rank || loading) && styles.predictBtnDisabled]}
            onPress={predict}
            disabled={!rank || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <TrendingUp size={18} color="#fff" strokeWidth={2.5} />
                <Text style={styles.predictBtnText}>Predict My Colleges</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {predicted && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Award size={18} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.resultsTitle}>
                {results.length} College{results.length !== 1 ? 's' : ''} Found
              </Text>
            </View>
            {results.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No colleges found for this rank & filters.</Text>
                <Text style={styles.noResultsHint}>Try selecting "All India" or a different category.</Text>
              </View>
            ) : (
              results.map((item) => (
                <View key={item.id}>
                  {renderResult({ item })}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  container: { flex: 1 },

  formCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    ...SHADOWS.md,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },

  rankInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  catPillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySurface },
  catPillText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  catPillTextActive: { color: COLORS.primary },

  stateSelector: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stateSelectorText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  stateDropdown: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  stateSearch: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    fontSize: 14,
    color: COLORS.text,
  },
  stateOption: { paddingHorizontal: 16, paddingVertical: 10 },
  stateOptionActive: { backgroundColor: COLORS.primarySurface },
  stateOptionText: { fontSize: 14, color: COLORS.text },
  stateOptionTextActive: { color: COLORS.primary, fontWeight: '600' },

  predictBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  predictBtnDisabled: { opacity: 0.5 },
  predictBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  resultsSection: { paddingHorizontal: 16 },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultsTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },

  noResults: { padding: 24, alignItems: 'center', gap: 8 },
  noResultsText: { fontSize: 15, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  noResultsHint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },

  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  resultImage: { width: 64, height: 64, borderRadius: 12, resizeMode: 'cover' },
  resultInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  resultName: { fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 19 },
  resultLocation: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  govtBadge: { backgroundColor: COLORS.tagGovtBg },
  privateBadge: { backgroundColor: COLORS.tagPrivateBg },
  typeBadgeText: { fontSize: 10, fontWeight: '600' },
  cutoffText: { fontSize: 11, color: COLORS.textSecondary },
  probabilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  probBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  probText: { fontSize: 11, fontWeight: '700' },
  rankDiff: { fontSize: 10, color: COLORS.textLight },
});
