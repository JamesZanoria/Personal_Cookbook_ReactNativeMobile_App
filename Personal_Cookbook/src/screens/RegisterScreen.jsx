import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { validateAuthForm } from '../utils/validate';
import { showToast } from '../components/Toast';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const [form,    setForm]    = useState({ name: '', email: '', password: '' });
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);
    const [pwVisible, setPwVisible] = useState(false);

    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    const handleRegister = async () => {
        const errs = validateAuthForm(form);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        try {
            setLoading(true);
            await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
        } catch (err) {
            showToast(err.message, 'error');
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
                {/* Heading */}
                <View style={styles.heading}>
                    <Text style={styles.title}>Join the Atelier</Text>
                    <Text style={styles.subtitle}>Create your free account and start collecting recipes</Text>
                </View>

                {/* Form card */}
                <View style={styles.card}>
                    {[
                        { key: 'name',     label: 'FULL NAME',       icon: 'user', placeholder: 'Your name',        secure: false, keyboard: 'default',       cap: 'words' },
                        { key: 'email',    label: 'EMAIL ADDRESS',   icon: 'mail', placeholder: 'you@example.com',   secure: false, keyboard: 'email-address', cap: 'none'  },
                        { key: 'password', label: 'PASSWORD',        icon: 'lock', placeholder: 'At least 6 characters',  secure: true,  keyboard: 'default',       cap: 'none'  },
                    ].map(field => (
                        <View key={field.key} style={styles.fieldGroup}>
                            <Text style={styles.label}>{field.label}</Text>
                            <View style={[styles.inputWrap, errors[field.key] && styles.inputWrapError]}>
                                <Feather name={field.icon} size={14} color={COLORS.muted} />
                                <TextInput
                                    style={styles.input}
                                    value={form[field.key]}
                                    onChangeText={v => set(field.key, v)}
                                    placeholder={field.placeholder}
                                    placeholderTextColor={COLORS.placeholder}
                                    secureTextEntry={field.secure && !pwVisible}
                                    keyboardType={field.keyboard}
                                    autoCapitalize={field.cap}
                                    autoCorrect={false}
                                />
                                {field.key === 'password' && (
                                    <TouchableOpacity onPress={() => setPwVisible(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Feather name={pwVisible ? 'eye-off' : 'eye'} size={14} color={COLORS.muted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.btnDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.88}
                    >
                        {loading
                            ? <ActivityIndicator color={COLORS.white} />
                            : <Text style={styles.primaryBtnText}>Create Account</Text>}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLinkText}>
                        Already have an account?{'  '}
                        <Text style={styles.loginLinkBold}>Sign in</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen:  { flex: 1, backgroundColor: COLORS.cream },
    content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 60 },

    backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28 },
    backIcon:{ fontSize: 16, color: COLORS.green },
    backText:{ fontFamily: FONTS.sansMed, fontSize: 13, color: COLORS.green },

    heading:      { marginTop: 50, marginBottom: 48, alignItems: 'center' },
    title:        { fontFamily: FONTS.serif, fontSize: 28, color: COLORS.ink, marginBottom: 6, textAlign: 'center' },
    subtitle:     { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted, lineHeight: 19, textAlign: 'center' },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 28, padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
        marginBottom: 24,
    },

    fieldGroup: { marginBottom: 20 },
    label: {
        fontFamily: FONTS.sansBold, fontSize: 9, letterSpacing: 1.1,
        color: COLORS.muted, textTransform: 'uppercase', marginBottom: 8,
    },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: COLORS.warm,
        borderWidth: 1.5, borderColor: COLORS.border,
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    },
    inputWrapError: { borderColor: COLORS.red },
    inputIcon: { fontSize: 14 },
    input: { flex: 1, fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.ink },
    eyeIcon:   { fontSize: 14 },
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

    loginLink:     { alignItems: 'center', paddingVertical: 4 },
    loginLinkText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.muted },
    loginLinkBold: { color: COLORS.green, fontFamily: FONTS.sansBold },
});