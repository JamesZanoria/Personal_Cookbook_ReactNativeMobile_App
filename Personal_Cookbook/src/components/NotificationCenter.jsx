import React from 'react';
import { Modal, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

export default function NotificationCenter({ visible, onClose }) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.sheet}>
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>Notifications</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Feather name="x" size={20} color={COLORS.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.center}>
                        <Feather name="bell" size={40} color={COLORS.border} style={{ marginBottom: 16 }} />
                        <Text style={styles.comingSoonTitle}>COMING SOON</Text>
                        <Text style={styles.emptyText}>Notifications are on the way!</Text>
                        <Text style={styles.subText}>We're cooking up a great way to keep you updated on your recipes and timers.</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end'
    },
    sheet: {
        backgroundColor: COLORS.cream,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '85%'
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: 24,
        color: COLORS.ink
    },
    closeBtn: {
        padding: 4
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontFamily: FONTS.sansBold,
        fontSize: 18,
        color: COLORS.ink,
        textAlign: 'center',
        marginBottom: 8
    },
    comingSoonTitle: {
        fontFamily: FONTS.sansBold,
        fontSize: 11,
        color: COLORS.green,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    subText: {
        fontFamily: FONTS.sans,
        fontSize: 14,
        color: COLORS.muted,
        textAlign: 'center',
        lineHeight: 20
    },
});
