import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Phone, User, Globe, Building, Package } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import Toast from 'react-native-toast-message';

export default function DeliveryFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    recipient_name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [sending, setSending] = useState(false);

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const isValid = form.recipient_name.trim()
    && form.phone.trim().length >= 10
    && form.address.trim()
    && form.city.trim()
    && form.state.trim()
    && /^\d{6}$/.test(form.pincode.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setSending(true);
    try {
      await api.requestDelivery(id!, {
        recipient_name: form.recipient_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      });
      Toast.show({ type: 'success', text1: 'Request submitted', text2: 'We will deliver the book to your address.' });
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: e?.message || 'Could not submit delivery request.' });
    }
    setSending(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Top Bar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
          </TouchableOpacity>
          <Text style={styles.topbarText}>BOOK DELIVERY</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Package size={24} color={COLORS.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.headerTitle}>Request Physical Copy</Text>
          <Text style={styles.headerDesc}>Fill in the delivery details below. We'll ship the book to your address.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Name</Text>
            <View style={styles.inputRow}>
              <User size={16} color={COLORS.placeholder} strokeWidth={1.6} />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={COLORS.placeholder}
                value={form.recipient_name}
                onChangeText={v => update('recipient_name', v)}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <Phone size={16} color={COLORS.placeholder} strokeWidth={1.6} />
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={COLORS.placeholder}
                value={form.phone}
                onChangeText={v => update('phone', v)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputRow}>
              <MapPin size={16} color={COLORS.placeholder} strokeWidth={1.6} />
              <TextInput
                style={styles.inputAddress}
                placeholder="Street, area, landmark, building..."
                placeholderTextColor={COLORS.placeholder}
                value={form.address}
                onChangeText={v => update('address', v)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputRow}>
                <Building size={16} color={COLORS.placeholder} strokeWidth={1.6} />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={COLORS.placeholder}
                  value={form.city}
                  onChangeText={v => update('city', v)}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>State</Text>
              <View style={styles.inputRow}>
                <Globe size={16} color={COLORS.placeholder} strokeWidth={1.6} />
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor={COLORS.placeholder}
                  value={form.state}
                  onChangeText={v => update('state', v)}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode</Text>
            <View style={styles.inputRow}>
              <MapPin size={16} color={COLORS.placeholder} strokeWidth={1.6} />
              <TextInput
                style={styles.input}
                placeholder="6-digit pincode"
                placeholderTextColor={COLORS.placeholder}
                value={form.pincode}
                onChangeText={v => update('pincode', v)}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Delivery Request</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 6 },
  backCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  topbarText: { fontSize: 12, fontWeight: '600', color: COLORS.muted, fontFamily: 'monospace', letterSpacing: 0.14 },

  header: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 10, paddingBottom: 4 },
  headerIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.fg, marginBottom: 8 },
  headerDesc: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 19 },

  form: { paddingHorizontal: 22, paddingTop: 20, gap: 14 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.fg, marginLeft: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  input: { flex: 1, fontSize: 14, color: COLORS.fg, padding: 0 },
  inputAddress: { flex: 1, fontSize: 14, color: COLORS.fg, padding: 0, minHeight: 60, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },

  submitBtn: { marginHorizontal: 22, marginTop: 24, paddingVertical: 14, borderRadius: 999, backgroundColor: COLORS.fg, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff', letterSpacing: 0.04 },
});
