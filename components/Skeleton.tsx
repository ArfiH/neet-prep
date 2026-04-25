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
        { width, height, borderRadius, backgroundColor: COLORS.skeleton },
        { opacity },
        style,
      ]}
    />
  );
}

export function PdfCardSkeleton() {
  return (
    <View style={styles.pdfCard}>
      <Skeleton height={110} borderRadius={0} style={{ borderTopLeftRadius: 14, borderTopRightRadius: 14 }} />
      <View style={styles.pdfCardBody}>
        <Skeleton width={60} height={10} style={{ marginBottom: 6 }} />
        <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="60%" height={10} />
      </View>
    </View>
  );
}

export function CollegeRowSkeleton() {
  return (
    <View style={styles.collegeRow}>
      <Skeleton width={56} height={56} borderRadius={10} />
      <View style={styles.collegeRowInfo}>
        <Skeleton width="70%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width={70} height={18} borderRadius={6} />
      </View>
    </View>
  );
}

export function StatCardSkeleton() {
  return (
    <View style={styles.statCard}>
      <Skeleton width={40} height={20} style={{ marginBottom: 4 }} />
      <Skeleton width={50} height={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  pdfCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
  },
  pdfCardBody: { padding: 10 },
  collegeRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  collegeRowInfo: { flex: 1, marginLeft: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
});