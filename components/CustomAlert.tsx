import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import {
  AlertCircle,
  CheckCircle2,
  LogOut,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'default' | 'destructive' | 'success' | 'warning';
  onDismiss: () => void;
}

const TYPE_CONFIG = {
  default: { icon: null, circleBg: null, iconColor: null },
  destructive: { icon: LogOut, circleBg: '#FEE2E2', iconColor: '#DC2626' },
  success: { icon: CheckCircle2, circleBg: '#DCFCE7', iconColor: '#16A34A' },
  warning: { icon: AlertCircle, circleBg: '#FEF3C7', iconColor: '#D97706' },
};

function getButtonStyle(style?: 'default' | 'cancel' | 'destructive') {
  switch (style) {
    case 'cancel':
      return styles.cancelBtn;
    case 'destructive':
      return styles.destructiveBtn;
    default:
      return styles.defaultBtn;
  }
}

function getButtonTextStyle(style?: 'default' | 'cancel' | 'destructive') {
  switch (style) {
    case 'cancel':
      return styles.cancelBtnText;
    case 'destructive':
      return styles.destructiveBtnText;
    default:
      return styles.defaultBtnText;
  }
}

export default function CustomAlert({
  visible,
  title,
  message,
  buttons = [],
  type = 'default',
  onDismiss,
}: CustomAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 260,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const config = TYPE_CONFIG[type];
  const IconComponent = config.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {(IconComponent && config.circleBg) || title ? (
              <View style={styles.headerRow}>
                {IconComponent && config.circleBg && (
                  <View style={[styles.iconCircle, { backgroundColor: config.circleBg }]}>
                    <IconComponent size={24} color={config.iconColor} strokeWidth={2} />
                  </View>
                )}
                {title ? <Text style={styles.title}>{title}</Text> : null}
              </View>
            ) : null}

            <Text style={[styles.message, !title && styles.messageNoTitle]}>
              {message}
            </Text>

            {buttons.length > 0 && (
              <View
                style={[
                  styles.buttonsRow,
                  buttons.length === 1 && styles.singleButton,
                ]}
              >
                {buttons.map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.btn, getButtonStyle(btn.style)]}
                    onPress={() => {
                      btn.onPress?.();
                      onDismiss();
                    }}
                  >
                    <Text style={getButtonTextStyle(btn.style)}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.fg,
    flexShrink: 1,
  },
  message: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  messageNoTitle: {
    marginTop: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  singleButton: {
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  defaultBtn: {
    backgroundColor: COLORS.primary,
  },
  defaultBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  cancelBtn: {
    backgroundColor: COLORS.stage,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.fg,
  },
  destructiveBtn: {
    backgroundColor: '#DC2626',
  },
  destructiveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
