import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { User, BookOpen, GraduationCap, Bell, Shield, HelpCircle, ChevronRight, LogOut, Star, CreditCard, TrendingUp } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

type ProfileData = {
  id: number;
  email: string;
  name: string | null;
  neet_rank: number | null;
  category: string | null;
  purchases_count: number;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (e) {
      console.log('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            try {
              await logout();
              router.replace('/login');
            } catch (e) {
              console.log('Logout error:', e);
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ]
    );
  }

  const userName = profile?.name || user?.name || 'Guest User';
  const userEmail = profile?.email || user?.email || 'No email';
  const userRank = profile?.neet_rank || user?.neet_rank || null;
  const userCategory = profile?.category || user?.category || 'General';
  const pdfsOwned = profile?.purchases_count || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#fff" strokeWidth={1.5} />
            </View>
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pdfsOwned}</Text>
              <Text style={styles.statLabel}>PDFs Owned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {userRank ? `#${userRank}` : '-'}
              </Text>
              <Text style={styles.statLabel}>NEET Rank</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userCategory}</Text>
              <Text style={styles.statLabel}>Category</Text>
            </View>
          </View>
        </View>

        {/* NEET Target Card */}
        <TouchableOpacity style={styles.neetCard} activeOpacity={0.8}>
          <View style={styles.neetCardLeft}>
            <TrendingUp size={28} color={COLORS.primary} strokeWidth={2} />
            <View style={styles.neetCardText}>
              <Text style={styles.neetCardTitle}>
                {userRank ? 'Update NEET Target' : 'Set NEET Target'}
              </Text>
              <Text style={styles.neetCardSub}>
                {userRank
                  ? `Current: Rank #${userRank} (${userCategory})`
                  : 'Add your target rank & category'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={COLORS.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Study Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => router.push('/(tabs)/pdfs' as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '18' }]}>
                <BookOpen size={18} color={COLORS.primary} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>My Purchased PDFs</Text>
                <Text style={styles.menuSublabel}>{pdfsOwned} PDFs in library</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/colleges' as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#2563EB18' }]}>
                <GraduationCap size={18} color="#2563EB" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>College Predictions</Text>
                <Text style={styles.menuSublabel}>Check your chances</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]} activeOpacity={0.75}>
              <View style={[styles.menuIcon, { backgroundColor: '#D9770618' }]}>
                <CreditCard size={18} color="#D97706" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Purchase History</Text>
                <Text style={styles.menuSublabel}>View past transactions</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]} activeOpacity={0.75}>
              <View style={[styles.menuIcon, { backgroundColor: '#7C3AED18' }]}>
                <Bell size={18} color="#7C3AED" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Notifications</Text>
                <Text style={styles.menuSublabel}>Manage alerts</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
              <View style={[styles.menuIcon, { backgroundColor: '#05966918' }]}>
                <Shield size={18} color="#059669" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Privacy & Security</Text>
                <Text style={styles.menuSublabel}>Data & account</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]} activeOpacity={0.75}>
              <View style={[styles.menuIcon, { backgroundColor: '#0EA5E918' }]}>
                <HelpCircle size={18} color="#0EA5E9" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Help & FAQ</Text>
                <Text style={styles.menuSublabel}>Common questions</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
              <View style={[styles.menuIcon, { backgroundColor: '#F59E0B18' }]}>
                <Star size={18} color="#F59E0B" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Rate the App</Text>
                <Text style={styles.menuSublabel}>Share feedback</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleLogout}
            disabled={logoutLoading}
            activeOpacity={0.85}
          >
            {logoutLoading ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <LogOut size={18} color="#EF4444" strokeWidth={2} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Neet Zyme v1.0.0</Text>
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