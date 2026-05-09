import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { User, BookOpen, GraduationCap, Bell, Shield, HelpCircle, ChevronRight, LogOut, LogIn, TrendingUp } from 'lucide-react-native';
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

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
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
            try {
              await logout();
              router.replace('/login');
            } catch (e) {
              console.log('Logout error:', e);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.centered} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={32} color={COLORS.fg} strokeWidth={1.5} />
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pdfsOwned}</Text>
              <Text style={styles.statLabel}>PDFs Owned</Text>
            </View>
            
            {/* Your NEET Rank */}
            {/* <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userRank ? `#${userRank}` : '-'}</Text>
              <Text style={styles.statLabel}>NEET Rank</Text>
            </View> */}
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>PDFs Read</Text>
            </View>
            
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>Days Streak</Text>
            </View>
          </View>
        </View>

        {/* NEET Target Card */}
        {/* <TouchableOpacity style={styles.neetCard} activeOpacity={0.8} onPress={() => router.push('/set-target')}>
          <View style={styles.neetCardLeft}>
            <TrendingUp size={24} color={COLORS.primaryDark} strokeWidth={2} />
            <View style={styles.neetCardText}>
              <Text style={styles.neetCardTitle}>{userRank ? 'Update NEET Target' : 'Set NEET Target'}</Text>
              <Text style={styles.neetCardSub}>
                {userRank ? `Current: Rank #${userRank} (${userCategory})` : 'Add your target rank & category'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.muted} strokeWidth={2} />
        </TouchableOpacity> */}

        {/* Study Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STUDY</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]} onPress={() => router.push('/(tabs)/pdfs' as any)} activeOpacity={0.75}>
              <View style={styles.menuIcon}>
                <BookOpen size={18} color={COLORS.primaryDark} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>My Purchased PDFs</Text>
                <Text style={styles.menuSublabel}>{pdfsOwned} PDFs in library</Text>
              </View>
              <ChevronRight size={16} color={COLORS.muted} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/colleges' as any)} activeOpacity={0.75}>
              <View style={styles.menuIcon}>
                <GraduationCap size={18} color={COLORS.primaryDark} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>College Predictions</Text>
                <Text style={styles.menuSublabel}>Check your chances</Text>
              </View>
              <ChevronRight size={16} color={COLORS.muted} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]} activeOpacity={0.75}>
              <View style={styles.menuIcon}>
                <Bell size={18} color={COLORS.primaryDark} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Notifications</Text>
                <Text style={styles.menuSublabel}>Manage alerts</Text>
              </View>
              <ChevronRight size={16} color={COLORS.muted} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
              <View style={styles.menuIcon}>
                <Shield size={18} color={COLORS.primaryDark} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Privacy & Security</Text>
                <Text style={styles.menuSublabel}>Data & account</Text>
              </View>
              <ChevronRight size={16} color={COLORS.muted} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]} activeOpacity={0.75}>
              <View style={styles.menuIcon}>
                <HelpCircle size={18} color={COLORS.primaryDark} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Help & FAQ</Text>
                <Text style={styles.menuSublabel}>Common questions</Text>
              </View>
              <ChevronRight size={16} color={COLORS.muted} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
              <View style={styles.menuIcon}>
                <User size={18} color={COLORS.primaryDark} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>About</Text>
                <Text style={styles.menuSublabel}>App info</Text>
              </View>
              <ChevronRight size={16} color={COLORS.muted} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In / Sign Out */}
        <View style={styles.section}>
          {user ? (
            <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <LogOut size={16} color={COLORS.muted} strokeWidth={2} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/login')} activeOpacity={0.85}>
              <LogIn size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.version}>NEET Zyme v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center' },

  profileHeader: { paddingTop: 20, paddingBottom: 20, alignItems: 'center', backgroundColor: COLORS.stage },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profileName: { fontSize: 20, fontWeight: '700', color: COLORS.fg },
  profileEmail: { fontSize: 13, color: COLORS.muted, marginTop: 2 },

  statsRow: { flexDirection: 'row', marginTop: 16, paddingHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 16, paddingVertical: 14, marginHorizontal: 24, borderWidth: 1, borderColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.fg },
  statLabel: { fontSize: 10, color: COLORS.muted, marginTop: 2, fontWeight: '500' },

  neetCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  neetCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  neetCardText: { flex: 1 },
  neetCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.fg },
  neetCardSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },

  section: { paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 10.5, fontWeight: '700', fontFamily: monoFont, color: COLORS.muted, marginBottom: 10, letterSpacing: 0.16 },

  menuCard: { backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: COLORS.fg },
  menuSublabel: { fontSize: 11, color: COLORS.muted, marginTop: 1 },

  signOutBtn: { backgroundColor: COLORS.stage, borderRadius: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  signOutText: { fontSize: 15, fontWeight: '600', color: COLORS.muted },
  signInBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  signInText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  version: { textAlign: 'center', fontSize: 10.5, fontFamily: monoFont, color: COLORS.muted, marginTop: 8 },
});
