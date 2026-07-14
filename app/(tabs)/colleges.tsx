import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Search, ChevronRight, TrendingUp, Award, X } from 'lucide-react-native';
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

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

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

  // College search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.searchColleges(searchQuery);
        setSearchResults(data || []);
        setShowSearchDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function doPredict() {
    if (!rank || isNaN(Number(rank))) return;
    setLoading(true);
    setPredicted(false);

    const userRank = parseInt(rank);
    try {
      const predictions = await api.predictColleges(userRank, category, state);
      setResults(predictions || []);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
    setPredicted(true);
  }

  const filteredStates = STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()));

  const probabilityColor = (p: number) => {
    if (p >= 0.9) return '#2ea86e';
    if (p >= 0.6) return '#e9a04a';
    return '#EF4444';
  };

  const probabilityLabel = (p: number) => {
    if (p >= 0.9) return 'High';
    if (p >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>College Predictor</Text>
          <Text style={styles.headerSubtitle}>Find colleges based on your NEET rank</Text>
        </View>

        {/* College Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputRow}>
            <Search size={18} color={COLORS.muted} strokeWidth={2} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search for a college by name..."
              placeholderTextColor={COLORS.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : searchQuery ? (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); }}>
                <X size={18} color={COLORS.muted} strokeWidth={2} />
              </TouchableOpacity>
            ) : null}
          </View>
          {showSearchDropdown && (
            <View style={styles.searchDropdown}>
              <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {searchResults.length === 0 ? (
                  <Text style={styles.searchNoResult}>No colleges found</Text>
                ) : (
                  searchResults.map((college) => (
                    <TouchableOpacity
                      key={college.id}
                      style={styles.searchResultItem}
                      onPress={() => {
                        router.push(`/college/${college.id}` as any);
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchDropdown(false);
                        searchInputRef.current?.blur();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.searchResultName} numberOfLines={1}>{college.name}</Text>
                      {college.city && (
                        <Text style={styles.searchResultLoc} numberOfLines={1}>{college.city}, {college.state}</Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Prediction Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Enter Your Details</Text>

          {/* Rank Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NEET Rank</Text>
            <TextInput
              style={styles.rankInput}
              placeholder="e.g. 15000"
              placeholderTextColor={COLORS.placeholder}
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
            <TouchableOpacity style={styles.stateSelector} onPress={() => setShowStateDropdown(!showStateDropdown)}>
              <Text style={styles.stateSelectorText}>{state}</Text>
              <ChevronRight size={16} color={COLORS.muted} style={{ transform: [{ rotate: showStateDropdown ? '-90deg' : '90deg' }] }} />
            </TouchableOpacity>
            {showStateDropdown && (
              <View style={styles.stateDropdown}>
                <TextInput style={styles.stateSearch} placeholder="Search state..." placeholderTextColor={COLORS.placeholder} value={stateSearch} onChangeText={setStateSearch} />
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {filteredStates.map((s) => (
                    <TouchableOpacity key={s} style={[styles.stateOption, state === s && styles.stateOptionActive]} onPress={() => { setState(s); setShowStateDropdown(false); setStateSearch(''); }}>
                      <Text style={[styles.stateOptionText, state === s && styles.stateOptionTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.predictBtn, (!rank || loading) && styles.predictBtnDisabled]} onPress={doPredict} disabled={!rank || loading} activeOpacity={0.85}>
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
              <Text style={styles.resultsTitle}>{results.length} College{results.length !== 1 ? 's' : ''} Found</Text>
            </View>
            {results.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No colleges found for this rank & filters.</Text>
                <Text style={styles.noResultsHint}>Try selecting "All India" or a different category.</Text>
              </View>
            ) : (
              results.map((item) => (
                <TouchableOpacity key={item.id} style={styles.resultCard} onPress={() => router.push(`/college/${item.id}` as any)} activeOpacity={0.88}>
                  <Image source={{ uri: item.image_url || 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg' }} style={styles.resultImage} />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.resultLocation}>{item.city ? `${item.city}, ` : ''}{item.state}</Text>
                    <View style={styles.resultMeta}>
                      <View style={[styles.typeBadge, item.type === 'Government' ? styles.govtBadge : styles.privateBadge]}>
                        <Text style={[styles.typeBadgeText, { color: item.type === 'Government' ? COLORS.tagGovt : COLORS.tagPrivate }]}>{item.type}</Text>
                      </View>
                      {item.cutoff_rank && item.cutoff_rank !== 999999 ? <Text style={styles.cutoffText}>Cutoff: {item.cutoff_rank.toLocaleString()}</Text> : null}
                    </View>
                    <View style={styles.probabilityRow}>
                      <View style={[styles.probBadge, { backgroundColor: probabilityColor(item.probability) + '20' }]}>
                        <Text style={[styles.probText, { color: probabilityColor(item.probability) }]}>{probabilityLabel(item.probability)} Chance</Text>
                      </View>
                      {item.cutoff_rank && item.cutoff_rank !== 999999 ? <Text style={styles.rankDiff}>{item.rank_diff >= 0 ? `+${item.rank_diff.toLocaleString()} margin` : `${Math.abs(item.rank_diff).toLocaleString()} above cutoff`}</Text> : null}
                    </View>
                  </View>
                  <ChevronRight size={16} color={COLORS.muted} strokeWidth={2} />
                </TouchableOpacity>
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

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.fg, letterSpacing: -0.01 },
  headerSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },

  formCard: { marginHorizontal: 16, marginTop: 8, backgroundColor: COLORS.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  formTitle: { fontSize: 16, fontWeight: '700', color: COLORS.fg, marginBottom: 16 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8 },

  rankInput: { backgroundColor: COLORS.stage, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 18, fontWeight: '700', color: COLORS.fg, borderWidth: 1, borderColor: COLORS.border },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  catPillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  catPillText: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
  catPillTextActive: { color: '#fff' },

  stateSelector: { backgroundColor: COLORS.stage, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  stateSelectorText: { fontSize: 15, color: COLORS.fg, fontWeight: '500' },
  stateDropdown: { marginTop: 8, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  stateSearch: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, fontSize: 14, color: COLORS.fg },
  stateOption: { paddingHorizontal: 16, paddingVertical: 10 },
  stateOptionActive: { backgroundColor: COLORS.primaryLight },
  stateOptionText: { fontSize: 14, color: COLORS.fg },
  stateOptionTextActive: { color: COLORS.primary, fontWeight: '600' },

  predictBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4, ...SHADOWS.md },
  predictBtnDisabled: { opacity: 0.5 },
  predictBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  resultsSection: { paddingHorizontal: 16 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultsTitle: { fontSize: 17, fontWeight: '700', color: COLORS.fg },

  noResults: { padding: 24, alignItems: 'center', gap: 8 },
  noResultsText: { fontSize: 15, fontWeight: '600', color: COLORS.fg, textAlign: 'center' },
  noResultsHint: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },

  resultCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  resultImage: { width: 64, height: 64, borderRadius: 12, resizeMode: 'cover' },
  resultInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  resultName: { fontSize: 14, fontWeight: '700', color: COLORS.fg, lineHeight: 19 },
  resultLocation: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  govtBadge: { backgroundColor: COLORS.tagGovtBg },
  privateBadge: { backgroundColor: COLORS.tagPrivateBg },
  typeBadgeText: { fontSize: 10, fontWeight: '600' },
  cutoffText: { fontSize: 11, color: COLORS.muted },
  probabilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  probBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  probText: { fontSize: 11, fontWeight: '700' },
  rankDiff: { fontSize: 10, color: COLORS.muted },

  searchContainer: { marginHorizontal: 16, marginBottom: 4, zIndex: 100 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.stage, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.fg, padding: 0 },
  searchDropdown: { marginTop: 4, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', maxHeight: 260 },
  searchNoResult: { padding: 16, textAlign: 'center', fontSize: 14, color: COLORS.muted },
  searchResultItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchResultName: { fontSize: 14, fontWeight: '600', color: COLORS.fg },
  searchResultLoc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});
