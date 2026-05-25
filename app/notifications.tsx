import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { api } from '@/lib/api';

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

type Notification = {
  id: number;
  title: string;
  body: string;
  is_read: number;
  created_at: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (e) {
      // ignore
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
        </TouchableOpacity>
        <Text style={styles.topbarText}>NOTIFICATIONS</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <CheckCheck size={14} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Bell size={48} color={COLORS.border} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>You'll see purchase confirmations and updates here</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {notifications.map((n) => (
            <View key={n.id} style={[styles.item, !n.is_read && styles.itemUnread]}>
              <View style={[styles.dot, !n.is_read && styles.dotUnread]} />
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{n.title}</Text>
                <Text style={styles.itemBody}>{n.body}</Text>
                <Text style={styles.itemTime}>{timeAgo(n.created_at)}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 6 },
  backCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  topbarText: { fontSize: 12, fontWeight: '600', color: COLORS.muted, fontFamily: monoFont, letterSpacing: 0.14, flex: 1 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.fg },
  emptySubtitle: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },

  list: { paddingHorizontal: 16, paddingTop: 8 },
  item: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  itemUnread: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary + '40' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginTop: 5, flexShrink: 0 },
  dotUnread: { backgroundColor: COLORS.primary },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.fg, marginBottom: 3 },
  itemBody: { fontSize: 13, color: COLORS.muted, lineHeight: 19 },
  itemTime: { fontSize: 10.5, fontFamily: monoFont, color: COLORS.muted, marginTop: 6 },
});
