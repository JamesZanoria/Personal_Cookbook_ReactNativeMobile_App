import React, { useState } from 'react';
import { Modal, TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/typography';

const MENU_ACTIONS = [
    { key: 'discover', label: 'Discover', icon: 'compass', navigateTo: ['Tabs', { screen: 'Discover' }] },
    { key: 'cookbook', label: 'Cookbook', icon: 'book-open', navigateTo: ['Tabs', { screen: 'Cookbook' }] },
    { key: 'create', label: 'Create Recipe', icon: 'edit-3', navigateTo: ['Create'] },
    { key: 'profile', label: 'Profile', icon: 'user', navigateTo: ['Tabs', { screen: 'Profile' }] },
];

export function ProfileMenu({ visible, onClose, navigation, user }) {
    const { logout } = useAuth();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.popover}>
                    <View style={styles.profileHeader}>
                        <View style={styles.profileInfo}>
                            {user?.avatar_url ? (
                                <Image source={{ uri: user.avatar_url }} style={styles.smallAvatar} />
                            ) : (
                                <View style={styles.smallAvatarFallback}>
                                    <Text style={styles.smallAvatarText}>
                                        {user?.name?.charAt(0)?.toUpperCase() || 'C'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.nameContainer}>
                                <Text style={styles.profileName} numberOfLines={1}>
                                    {user?.name || 'Guest User'}
                                </Text>
                                <Text style={styles.profileEmail} numberOfLines={1}>
                                    {user?.email || 'Guest Account'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => {
                            onClose();
                            logout();
                        }}
                        activeOpacity={0.85}
                    >
                        <View style={styles.itemLeft}>
                            <Feather name="user-plus" size={18} color={COLORS.green} />
                            <Text style={styles.itemText}>Change Account</Text>
                        </View>
                        <Feather name="chevron-right" size={16} color={COLORS.muted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => {
                            onClose();
                            navigation.navigate('Profile');
                        }}
                        activeOpacity={0.85}
                    >
                        <View style={styles.itemLeft}>
                            <Feather name="user" size={18} color={COLORS.green} />
                            <Text style={styles.itemText}>My Profile</Text>
                        </View>
                        <Feather name="chevron-right" size={16} color={COLORS.muted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.item, styles.logoutItem]}
                        onPress={() => {
                            onClose();
                            logout();
                        }}
                        activeOpacity={0.85}
                    >
                        <View style={styles.itemLeft}>
                            <Feather name="log-out" size={18} color={COLORS.red} />
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </View>
                        <Feather name="chevron-right" size={16} color={COLORS.muted} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

export default function AppMenuSheet({ visible, onClose, navigation }) {
    const { logout } = useAuth();

    const handlePress = (action) => {
        onClose();
        navigation.navigate(...action.navigateTo);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Feather name="coffee" size={24} color={COLORS.green} />
                            <Text style={styles.logoText}>Digital Atelier</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Feather name="x" size={20} color={COLORS.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.navContainer}>
                        <Text style={styles.sectionLabel}>MENU</Text>
                        {MENU_ACTIONS.map((action) => (
                            <TouchableOpacity
                                key={action.key}
                                style={styles.item}
                                activeOpacity={0.7}
                                onPress={() => handlePress(action)}
                            >
                                <View style={styles.itemLeft}>
                                    <Feather name={action.icon} size={20} color={COLORS.green} />
                                    <Text style={styles.itemText}>{action.label}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.item, styles.logoutItem]}
                            activeOpacity={0.7}
                            onPress={() => {
                                onClose();
                                logout();
                            }}
                        >
                            <View style={styles.itemLeft}>
                                <Feather name="log-out" size={20} color={COLORS.red} />
                                <Text style={styles.logoutText}>Sign Out</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.42)',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    popover: {
        backgroundColor: COLORS.cream,
        borderRadius: 20,
        padding: 16,
        width: 220,
        ...SHADOWS.md,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        marginBottom: 12,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    nameContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    smallAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    smallAvatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1DCCF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallAvatarText: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
        color: COLORS.orange,
    },
    profileName: {
        fontFamily: FONTS.sansBold,
        fontSize: 16,
        color: COLORS.ink,
        lineHeight: 20,
    },
    profileEmail: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        color: COLORS.muted,
        lineHeight: 16,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 12,
    },
    sheet: {
        backgroundColor: COLORS.white,
        borderTopRightRadius: 32,
        borderBottomRightRadius: 32,
        paddingHorizontal: 20,
        paddingTop: 60,
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 280,
        ...SHADOWS.md,
    },
    header: {
        marginBottom: 32,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F0EDE8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoText: {
        fontFamily: FONTS.serif,
        fontSize: 22,
        color: COLORS.ink,
        fontWeight: '600',
    },
    navContainer: {
        flex: 1,
        gap: 8,
    },
    sectionLabel: {
        fontFamily: FONTS.sansBold,
        fontSize: 10,
        color: COLORS.muted,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 16,
        marginLeft: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 14,
        marginBottom: 4,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    itemText: {
        fontFamily: FONTS.sansMed,
        fontSize: 15,
        color: '#4C473F',
    },
    footer: {
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#F0EDE8',
        paddingTop: 24,
    },
    logoutItem: {
        backgroundColor: 'transparent',
    },
    logoutText: {
        fontFamily: FONTS.sansBold,
        fontSize: 15,
        color: COLORS.red,
    },
});
