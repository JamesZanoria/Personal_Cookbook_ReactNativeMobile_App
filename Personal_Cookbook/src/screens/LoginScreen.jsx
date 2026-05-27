import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator,
    KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { validateAuthForm } from '../utils/validate';
import { showToast } from '../components/Toast';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [form,    setForm]    = useState({ email: '', password: '' });
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);
    const [pwVisible, setPwVisible] = useState(false);

    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    const handleLogin = async () => {
        const errs = validateAuthForm(form);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        try {
            setLoading(true);
            await login(form.email.trim().toLowerCase(), form.password);
        } catch (err) {
            if (err.message === 'Password is incorrect') {
                setErrors(prev => ({ ...prev, password: 'Password is incorrect' }));
            } else {
                showToast(err.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero section */}
                <View style={styles.hero}>
                    <View style={styles.logoRing}>
                        <Feather name="coffee" size={36} color={COLORS.green} />
                    </View>
                </View>

                {/* Form card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Digital Atelier</Text>
                    <Text style={styles.cardSubtitle}>Your personal culinary studio</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <View style={[styles.inputWrap, errors.email && styles.inputWrapError]}>
                            <Feather name="mail" size={14} color={COLORS.muted} />
                            <TextInput
                                style={styles.input}
                                value={form.email}
                                onChangeText={v => set('email', v)}
                                placeholder="you@example.com"
                                placeholderTextColor={COLORS.placeholder}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>PASSWORD</Text>
                        <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
                            <Feather name="lock" size={14} color={COLORS.muted} />
                            <TextInput
                                style={styles.input}
                                value={form.password}
                                onChangeText={v => set('password', v)}
                                placeholder="••••••••"
                                placeholderTextColor={COLORS.placeholder}
                                secureTextEntry={!pwVisible}
                            />
                            <TouchableOpacity onPress={() => setPwVisible(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Feather name={pwVisible ? 'eye-off' : 'eye'} size={14} color={COLORS.muted} />
                            </TouchableOpacity>
                        </View>
                        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.88}
                    >
                        {loading
                            ? <ActivityIndicator color={COLORS.white} />
                            : <Text style={styles.primaryBtnText}>Sign In</Text>}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.88}
                    >
                        <Text style={styles.secondaryBtnText}>Create an account</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>
                    By signing in you agree to our{' '}
                    <Text style={styles.footerLink}>Terms of Service</Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen:  { flex: 1, backgroundColor: COLORS.cream },
    content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 60 },

    hero: { alignItems: 'center', marginBottom: 48 },
    logoRing: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: COLORS.white,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        shadowColor: COLORS.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 2,
        borderColor: COLORS.greenLight,
    },
    brand:      { fontFamily: FONTS.serif, fontSize: 28, color: COLORS.ink, marginBottom: 4 },
    tagline:    { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 28,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 4,
        marginBottom: 24,
    },
    cardTitle:    { fontFamily: FONTS.serif, fontSize: 22, color: COLORS.ink, marginBottom: 4, textAlign: 'center' },
    cardSubtitle: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted, marginBottom: 24, textAlign: 'center' },

    fieldGroup: { marginBottom: 20 },
    label: {
        fontFamily: FONTS.sansBold, fontSize: 9,
        letterSpacing: 1.1, color: COLORS.muted,
        textTransform: 'uppercase', marginBottom: 8,
    },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: COLORS.warm,
        borderWidth: 1.5, borderColor: COLORS.border,
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    },
    inputWrapError: { borderColor: COLORS.red },
    inputIcon: { fontSize: 14 },
    input: {
        flex: 1, fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.base, color: COLORS.ink,
    },
    eyeIcon: { fontSize: 14 },
    errorText: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.red, marginTop: 5 },

    primaryBtn: {
        backgroundColor: COLORS.green, borderRadius: 50,
        paddingVertical: 16, alignItems: 'center', marginTop: 20,
        shadowColor: COLORS.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    btnDisabled:    { opacity: 0.6 },
    primaryBtnText: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.base, color: COLORS.white },

    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    dividerText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.muted },

    secondaryBtn: {
        borderWidth: 1.5, borderColor: COLORS.border,
        borderRadius: 50, paddingVertical: 14, alignItems: 'center',
    },
    secondaryBtnText: { fontFamily: FONTS.sansMed, fontSize: FONT_SIZES.base, color: COLORS.ink },

    footer:     { textAlign: 'center', fontFamily: FONTS.sans, fontSize: 11, color: COLORS.muted },
    footerLink: { color: COLORS.green, fontFamily: FONTS.sansMed },
});