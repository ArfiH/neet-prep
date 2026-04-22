import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, BookOpen, GraduationCap, Bell, Shield, Circle as HelpCircle, ChevronRight, LogOut, Star, CreditCard } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const MENU_SECTIONS = [
  {
    title: 'Study',
    items: [
      { icon: BookOpen, label: 'My Purchased PDFs', sublabel: 'Access your library', color: COLORS.primary, route: '/(tabs)/pdfs' },
      { icon: GraduationCap, label: 'Saved Predictions', sublabel: 'Your college predictions', color: '#2563EB', route: '/(tabs)/colleges' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: CreditCard, label: 'Purchase History', sublabel: 'View past transactions', color: '#D97706', route: null },
      { icon: Bell, label: 'Notifications', sublabel: 'Manage alerts', color: '#7C3AED', route: null },
      { icon: Shield, label: 'Privacy & Security', sublabel: 'Data & account security', color: '#059669', route: null },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help & FAQ', sublabel: 'Common questions', color: '#0EA5E9', route: null },
      { icon: Star, label: 'Rate the App', sublabel: 'Share your feedback', color: '#F59E0B', route: null },
    ],
  },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#fff" strokeWidth={1.5} />
            </View>
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>Edit</Text>
            </View>
          </View>
          <Text style={styles.profileName}>Medical Student</Text>
          <Text style={styles.profileEmail}>student@example.com</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>PDFs Owned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Predictions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>NEET</Text>
              <Text style={styles.statLabel}>Exam Target</Text>
            </View>
          </View>
        </View>

        {/* NEET Info Card */}
        <View style={styles.neetCard}>
          <View style={styles.neetCardLeft}>
            <GraduationCap size={28} color={COLORS.primary} strokeWidth={2} />
            <View style={styles.neetCardText}>
              <Text style={styles.neetCardTitle}>Set Your NEET Target</Text>
              <Text style={styles.neetCardSub}>Update your target rank & category</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.setTargetBtn}>
            <Text style={styles.setTargetBtnText}>Set</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]}
                    onPress={() => item.route && router.push(item.route as any)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                      <Icon size={18} color={item.color} strokeWidth={2} />
                    </View>
                    <View style={styles.menuText}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuSublabel}>{item.sublabel}</Text>
                    </View>
                    <ChevronRight size={16} color={COLORS.textLight} strokeWidth={2} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.85}>
            <LogOut size={18} color='#EF4444' strokeWidth={2} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>MedPrep v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  container: { flex: 1 },

  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  editBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  profileName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 24,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },

  neetCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  neetCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  neetCardText: { flex: 1 },
  neetCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  neetCardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  setTargetBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  setTargetBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  menuCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', ...SHADOWS.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  menuSublabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },

  signOutBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  version: { textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
});
