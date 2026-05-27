import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Image,
    ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/auth';
import { useUpload } from '../hooks/useUpload';
import { showToast } from '../components/Toast';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';

export default function ProfileScreen({ navigation }) {
    const { user, logout, updateUser } = useAuth();
    const { pickAndUpload, uploading } = useUpload();

    const [editMode,             setEditMode]             = useState(false);
    const [name,                 setName]                 = useState(user?.name || '');
    const [avatarUrl,            setAvatarUrl]            = useState(user?.avatar_url || '');
    const [currentPassword,      setCurrentPassword]      = useState('');
    const [newPassword,          setNewPassword]          = useState('');
    const [confirmPassword,      setConfirmPassword]      = useState('');
    const [showPasswordSection,  setShowPasswordSection]  = useState(false);
    const [showCurrentPw,        setShowCurrentPw]        = useState(false);
    const [showNewPw,            setShowNewPw]            = useState(false);
    const [showConfirmPw,        setShowConfirmPw]        = useState(false);
    const [saving,               setSaving]               = useState(false);

    // Keep local form state in sync whenever user changes (e.g. after save)
    useEffect(() => {
        setName(user?.name || '');
        setAvatarUrl(user?.avatar_url || '');
    }, [user]);

    const handlePickAvatar = async () => {
        const url = await pickAndUpload();
        if (url) setAvatarUrl(url);
    };

    const handleSave = async () => {
        if (!name.trim()) { showToast('Name cannot be empty', 'error'); return; }

        if (showPasswordSection && newPassword) {
            if (!currentPassword) { showToast('Enter your current password', 'error'); return; }
            if (newPassword.length < 6) { showToast('New password must be at least 6 characters', 'error'); return; }
            if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
        }

        try {
            setSaving(true);
            const payload = { name: name.trim(), avatar_url: avatarUrl || null };
            if (showPasswordSection && newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword     = newPassword;
            }

            const updated = await authAPI.updateMe(payload);

            // updateUser writes to SecureStore AND updates AuthContext so every
            // screen that reads `user` from useAuth() re-renders automatically.
            await updateUser({ name: updated.name, avatar_url: updated.avatar_url });

            setEditMode(false);
            setShowPasswordSection(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showToast('Profile updated!');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setName(user?.name || '');
        setAvatarUrl(user?.avatar_url || '');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
        setEditMode(false);
    };

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout },
            ]
        );
    };

    const displayAvatar = editMode ? avatarUrl : user?.avatar_url;
    const initial       = (user?.name || 'U')[0].toUpperCase();

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >

                {/* ── Top bar ─────────────────────────────────────────────── */}
                <View style={styles.topBar}>
                    <Text style={styles.brand}>Digital Atelier</Text>
                    {!editMode ? (
                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => setEditMode(true)}
                            activeOpacity={0.8}
                        >
                            <Feather name="edit-2" size={13} color={COLORS.green} />
                            <Text style={styles.editBtnText}>Edit Profile</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleCancelEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Avatar hero ──────────────────────────────────────────── */}
                <View style={styles.avatarHero}>
                    <View style={styles.avatarWrap}>
                        {displayAvatar ? (
                            <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarInitial}>{initial}</Text>
                            </View>
                        )}

                        {editMode && (
                            <TouchableOpacity
                                style={styles.cameraBtn}
                                onPress={handlePickAvatar}
                                disabled={uploading}
                                activeOpacity={0.85}
                            >
                                {uploading
                                    ? <ActivityIndicator size="small" color={COLORS.white} />
                                    : <Feather name="camera" size={16} color={COLORS.white} />
                                }
                            </TouchableOpacity>
                        )}
                    </View>

                    {!editMode ? (
                        <>
                            <Text style={styles.userName}>{user?.name || 'Chef'}</Text>
                            <Text style={styles.userEmail}>{user?.email || ''}</Text>
                        </>
                    ) : (
                        <Text style={styles.avatarHint}>
                            {uploading ? 'Uploading photo…' : 'Tap the camera to change your photo'}
                        </Text>
                    )}
                </View>

                {/* ── READ-ONLY view ───────────────────────────────────────── */}
                {!editMode && (
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <Feather name="user" size={15} color={COLORS.green} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>FULL NAME</Text>
                                <Text style={styles.infoValue}>{user?.name || '—'}</Text>
                            </View>
                        </View>
                        <View style={styles.sep} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <Feather name="mail" size={15} color={COLORS.green} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
                                <Text style={styles.infoValue}>{user?.email || '—'}</Text>
                            </View>
                        </View>
                        <View style={styles.sep} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <Feather name="lock" size={15} color={COLORS.green} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>PASSWORD</Text>
                                <Text style={styles.infoValue}>••••••••</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── EDIT form ────────────────────────────────────────────── */}
                {editMode && (
                    <View style={styles.editCard}>

                        {/* Name */}
                        <Text style={styles.sectionLabel}>BASIC INFO</Text>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Full Name</Text>
                            <View style={styles.fieldWrap}>
                                <Feather name="user" size={15} color={COLORS.muted} style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.fieldInput}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Your name"
                                    placeholderTextColor={COLORS.placeholder}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Change password toggle */}
                        <TouchableOpacity
                            style={styles.pwToggle}
                            onPress={() => setShowPasswordSection(v => !v)}
                            activeOpacity={0.8}
                        >
                            <Feather name="lock" size={15} color={COLORS.green} />
                            <Text style={styles.pwToggleText}>
                                {showPasswordSection ? 'Hide password change' : 'Change password'}
                            </Text>
                            <Feather
                                name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color={COLORS.muted}
                            />
                        </TouchableOpacity>

                        {showPasswordSection && (
                            <View style={styles.pwSection}>
                                <Text style={styles.sectionLabel}>CHANGE PASSWORD</Text>

                                {[
                                    { label: 'Current Password',  val: currentPassword, set: setCurrentPassword, vis: showCurrentPw, toggle: () => setShowCurrentPw(v => !v) },
                                    { label: 'New Password',      val: newPassword,      set: setNewPassword,     vis: showNewPw,     toggle: () => setShowNewPw(v => !v)     },
                                    { label: 'Confirm Password',  val: confirmPassword,  set: setConfirmPassword, vis: showConfirmPw, toggle: () => setShowConfirmPw(v => !v) },
                                ].map(f => (
                                    <View key={f.label} style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>{f.label}</Text>
                                        <View style={[
                                            styles.fieldWrap,
                                            f.label === 'Confirm Password' && f.val && f.val !== newPassword
                                                ? styles.fieldWrapError : null,
                                        ]}>
                                            <Feather name="lock" size={15} color={COLORS.muted} style={styles.fieldIcon} />
                                            <TextInput
                                                style={styles.fieldInput}
                                                value={f.val}
                                                onChangeText={f.set}
                                                placeholder="••••••••"
                                                placeholderTextColor={COLORS.placeholder}
                                                secureTextEntry={!f.vis}
                                            />
                                            <TouchableOpacity onPress={f.toggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                <Feather name={f.vis ? 'eye-off' : 'eye'} size={15} color={COLORS.muted} />
                                            </TouchableOpacity>
                                        </View>
                                        {f.label === 'Confirm Password' && f.val && f.val !== newPassword && (
                                            <Text style={styles.fieldError}>Passwords do not match</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Save */}
                        <TouchableOpacity
                            style={[styles.saveBtn, (saving || uploading) && styles.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={saving || uploading}
                            activeOpacity={0.88}
                        >
                            {saving
                                ? <ActivityIndicator color={COLORS.white} size="small" />
                                : <>
                                    <Feather name="check" size={15} color={COLORS.white} />
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                  </>
                            }
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Quick links ──────────────────────────────────────────── */}
                {!editMode && (
                    <View style={styles.linksCard}>
                        <TouchableOpacity
                            style={styles.linkRow}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Tabs', {
                                screen: 'Cookbook', params: { initialTab: 'Mine' }
                            })}
                        >
                            <View style={[styles.linkIcon, { backgroundColor: '#EFF6FF' }]}>
                                <Feather name="book-open" size={15} color="#3B82F6" />
                            </View>
                            <Text style={styles.linkText}>My Recipes</Text>
                            <Feather name="chevron-right" size={16} color={COLORS.border} />
                        </TouchableOpacity>

                        <View style={styles.sep} />

                        <TouchableOpacity
                            style={styles.linkRow}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Tabs', {
                                screen: 'Cookbook', params: { initialTab: 'Saved' }
                            })}
                        >
                            <View style={[styles.linkIcon, { backgroundColor: '#F0FDF4' }]}>
                                <Feather name="bookmark" size={15} color={COLORS.green} />
                            </View>
                            <Text style={styles.linkText}>Saved Recipes</Text>
                            <Feather name="chevron-right" size={16} color={COLORS.border} />
                        </TouchableOpacity>

                        <View style={styles.sep} />

                        <TouchableOpacity
                            style={styles.linkRow}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Tabs', { screen: 'Create' })}
                        >
                            <View style={[styles.linkIcon, { backgroundColor: '#FFF7ED' }]}>
                                <Feather name="plus-circle" size={15} color={COLORS.orange} />
                            </View>
                            <Text style={styles.linkText}>Create Recipe</Text>
                            <Feather name="chevron-right" size={16} color={COLORS.border} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Sign out ─────────────────────────────────────────────── */}
                {!editMode && (
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                        <Feather name="log-out" size={16} color={COLORS.red} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe:    { flex: 1, backgroundColor: '#FCFAF6' },
    content: { paddingHorizontal: 16, paddingBottom: 100 },

    // Top bar
    topBar: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingTop: 10, paddingBottom: 20,
    },
    brand:       { fontFamily: FONTS.serifMed, fontSize: 16, color: COLORS.green },
    editBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: COLORS.card,
        borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8,
    },
    editBtnText: { fontFamily: FONTS.sansMed, fontSize: 12, color: COLORS.green },
    cancelText:  { fontFamily: FONTS.sansMed, fontSize: 13, color: COLORS.muted },

    // Avatar hero
    avatarHero: { alignItems: 'center', marginBottom: 24 },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatarImage: {
        width: 96, height: 96, borderRadius: 48,
        borderWidth: 3, borderColor: COLORS.white,
        ...SHADOWS.md,
    },
    avatarFallback: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: COLORS.green,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: COLORS.white,
        ...SHADOWS.md,
    },
    avatarInitial: { fontFamily: FONTS.serif, fontSize: 36, color: COLORS.white },
    cameraBtn: {
        position: 'absolute', bottom: 0, right: 0,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: COLORS.ink,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: COLORS.white,
    },
    userName:   { fontFamily: FONTS.serif, fontSize: 22, color: COLORS.ink, marginBottom: 3 },
    userEmail:  { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted },
    avatarHint: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted, fontStyle: 'italic', marginTop: 4 },

    // Info card
    infoCard: {
        backgroundColor: COLORS.card, borderRadius: 16,
        borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, marginBottom: 16, ...SHADOWS.sm,
    },
    infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
    infoIconWrap:{
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: COLORS.greenLight,
        alignItems: 'center', justifyContent: 'center',
    },
    infoContent: { flex: 1 },
    infoLabel:   { fontFamily: FONTS.sansBold, fontSize: 9, color: COLORS.muted, letterSpacing: 0.8, marginBottom: 3 },
    infoValue:   { fontFamily: FONTS.sansMed, fontSize: 14, color: COLORS.ink },
    sep:         { height: 1, backgroundColor: COLORS.border },

    // Edit card
    editCard: {
        backgroundColor: COLORS.card, borderRadius: 16,
        borderWidth: 1, borderColor: COLORS.border,
        padding: 16, marginBottom: 16, ...SHADOWS.sm,
    },
    sectionLabel: {
        fontFamily: FONTS.sansBold, fontSize: 9, letterSpacing: 1,
        color: COLORS.muted, marginBottom: 14,
    },
    fieldGroup:  { marginBottom: 14 },
    fieldLabel:  { fontFamily: FONTS.sansBold, fontSize: 10, color: COLORS.muted, letterSpacing: 0.5, marginBottom: 6 },
    fieldWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F8F6F2', borderWidth: 1.5, borderColor: COLORS.border,
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
    },
    fieldWrapError: { borderColor: COLORS.red },
    fieldIcon:   {},
    fieldInput:  { flex: 1, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.ink },
    fieldError:  { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.red, marginTop: 4 },

    pwToggle: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 12, marginBottom: 4,
    },
    pwToggleText: { flex: 1, fontFamily: FONTS.sansMed, fontSize: 13, color: COLORS.green },
    pwSection: {
        borderTopWidth: 1, borderTopColor: COLORS.border,
        paddingTop: 14, marginBottom: 6,
    },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: COLORS.green, borderRadius: 50,
        paddingVertical: 14, marginTop: 8, ...SHADOWS.sm,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.white },

    // Quick links
    linksCard: {
        backgroundColor: COLORS.card, borderRadius: 16,
        borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, marginBottom: 14, ...SHADOWS.sm,
    },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
    linkIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    linkText: { flex: 1, fontFamily: FONTS.sansMed, fontSize: 14, color: COLORS.ink },

    // Logout
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        paddingVertical: 14, borderRadius: 14,
        borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FEF2F2',
    },
    logoutText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.red },
});