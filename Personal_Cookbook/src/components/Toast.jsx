// Imperative toast — call showToast('message', 'success'|'error') anywhere
import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, SafeAreaView, View, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';

// Singleton ref so any screen can trigger it
let _showToast = null;
export const showToast = (message, type = 'success') => {
  _showToast?.(message, type);
};

export default function Toast() {
  const [visible,  setVisible]  = useState(false);
  const [message,  setMessage]  = useState('');
  const [type,     setType]     = useState('success');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer   = useRef(null);

  useEffect(() => {
    _showToast = (msg, t) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(msg);
      setType(t);
      setVisible(true);

      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    };

    return () => { _showToast = null; };
  }, [opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        type === 'error' ? styles.error : styles.success,
        { opacity },
      ]}
      pointerEvents="none"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        {type === 'success' ? (
          <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
        ) : (
          <Ionicons name="close-circle" size={16} color={COLORS.white} />
        )}
        <Text style={[styles.text, { marginLeft: 8 }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  success: { backgroundColor: COLORS.green },
  error:   { backgroundColor: COLORS.red   },
  text: {
    fontFamily: FONTS.sansMed,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
});