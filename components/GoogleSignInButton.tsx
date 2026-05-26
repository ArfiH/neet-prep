import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

type Props = {
  onPress: () => void;
  loading?: boolean;
  label?: string;
};

export default function GoogleSignInButton({ onPress, loading, label = 'Continue with Google' }: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.muted} />
      ) : (
        <>
          <FontAwesome name="google" size={18} color="#EA4335" />
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.fg,
  },
});
