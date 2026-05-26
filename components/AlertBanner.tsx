import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';

const ALERT_CONFIG = {
  error: {
    bg: '#FEF2F2',
    border: '#DC2626',
    textColor: '#DC2626',
    icon: AlertCircle,
  },
  success: {
    bg: '#F0FDF4',
    border: '#16A34A',
    textColor: '#16A34A',
    icon: CheckCircle2,
  },
  info: {
    bg: '#EFF6FF',
    border: '#2563EB',
    textColor: '#2563EB',
    icon: Info,
  },
};

interface AlertAction {
  label: string;
  onPress: () => void;
}

interface AlertBannerProps {
  type: 'error' | 'success' | 'info';
  message: string;
  action?: AlertAction;
  dismissable?: boolean;
  onDismiss?: () => void;
}

export default function AlertBanner({
  type,
  message,
  action,
  dismissable,
  onDismiss,
}: AlertBannerProps) {
  const config = ALERT_CONFIG[type];
  const Icon = config.icon;

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <View style={[styles.border, { backgroundColor: config.border }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Icon size={18} color={config.border} strokeWidth={2.5} />
          <Text style={[styles.message, { color: config.textColor }]}>
            {message}
          </Text>
          {dismissable && onDismiss && (
            <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={config.textColor} />
            </TouchableOpacity>
          )}
        </View>
        {action && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: config.border }]}
            onPress={action.onPress}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  border: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionBtn: {
    alignSelf: 'stretch',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
