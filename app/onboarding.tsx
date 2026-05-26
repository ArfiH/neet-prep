import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  Platform,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, GraduationCap, Award } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { images } from '@/constants/images';
import { markOnboardingComplete } from '@/lib/onboardingStorage';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    headline: 'PREDICT YOUR\nMEDICAL FUTURE',
    subtext: 'Enter your NEET UG expected score and discover which top medical colleges await you.',
    gradient: ['#e6f4ea', '#c8e6d9'] as const,
    image: images.onboarding.slide1,
    Icon: Heart,
  },
  {
    id: '2',
    headline: 'DATA-DRIVEN\nCOLLEGE MATCH',
    subtext: 'Our advanced algorithm analyzes past year cut-offs to give you the most accurate predictions.',
    gradient: ['#d8e8f5', '#c5d9f2'] as const,
    image: images.onboarding.slide2,
    Icon: GraduationCap,
  },
  {
    id: '3',
    headline: 'START YOUR\nJOURNEY NOW',
    subtext: 'Join thousands of aspirants who planned their medical careers with us. Get started in under a minute.',
    gradient: ['#d8f5e5', '#b8e8d0'] as const,
    image: images.onboarding.slide3,
    Icon: Award,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  const isLast = index === slides.length - 1;

  const complete = useCallback(async () => {
    await markOnboardingComplete();
    router.replace('/login');
  }, [router]);

  const handleNext = useCallback(() => {
    if (isLast) {
      complete();
    } else {
      flatRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  }, [isLast, index, complete]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0] && viewableItems[0].index !== null) {
        setIndex(viewableItems[0].index);
      }
    },
    []
  );

  const renderSlide = useCallback(
    ({ item }: { item: (typeof slides)[number] }) => {
      const { headline, subtext, gradient, image, Icon } = item;

      return (
        <View style={styles.slide}>
          <LinearGradient colors={gradient} style={styles.circleFrame}>
            <Image source={image} style={styles.circleImage} />
          </LinearGradient>

          <View style={styles.iconRow}>
            <Icon size={24} color={gradient[1]} />
          </View>

          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.subtext}>{subtext}</Text>
        </View>
      );
    },
    []
  );

  return (
    <View style={styles.container}>
      {!isLast && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={complete}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { opacity, transform: [{ scale }] },
                  index === i && styles.dotActive,
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, isLast && styles.nextBtnFull]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {isLast
              ? 'Get Started'
              : index === 0
                ? 'Next Step \u2192'
                : 'Continue \u2192'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  circleFrame: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  circleImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.border,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.fg,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  subtext: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.muted,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  nextBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  nextBtnFull: {
    backgroundColor: COLORS.primary,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
