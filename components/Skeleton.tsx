import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { COLORS } from '@/constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: COLORS.border },
        { opacity },
        style,
      ]}
    />
  );
}

export function PdfTileSkeleton() {
  return (
    <View style={styles.pdfTile}>
      <Skeleton width={28} height={28} borderRadius={8} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={13} style={{ marginBottom: 6 }} />
      <Skeleton width="50%" height={10} />
    </View>
  );
}

export function CollegeRowSkeleton() {
  return (
    <View style={styles.collegeRow}>
      <Skeleton width={56} height={56} borderRadius={12} />
      <View style={styles.collegeRowInfo}>
        <Skeleton width="70%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width={70} height={18} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pdfTile: {
    width: '48%',
    backgroundColor: COLORS.stage,
    borderRadius: 18,
    padding: 12,
    minHeight: 116,
  },
  collegeRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  collegeRowInfo: { flex: 1, marginLeft: 12 },
});
