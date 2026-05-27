import React from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Touchable, } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';

export default function StepBlock({ step, index, onChange, onRemove, onPickPhoto }){
    return(
        <View style={styles.block}>
            {/* Number badge and header */}
            <View style={styles.header}>
                <View style={styles.numBadge}>
                    <Text style={styles.numText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepLabel}>Step {index + 1}</Text>
                {index > 0 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close" size={16} color={COLORS.muted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Instruction textarea */}
            <TextInput
                style={styles.textarea}
                value={step.text}
                onChangeText={(v) => onChange(index, 'text', v)}
                placeholder="Describe this step..."
                placeholderTextColor={COLORS.placeholder}
                multiline
                textAlignVertical="top"
            />

            {/* Step photo */}
            {step.photo_url ? (
                <View style={styles.photoWrap}>
                    <Image source={{ uri: step.photo_url }} style={styles.photo} />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => onChange(index, 'photo_url', '')}>
                        <Text style={styles.removePhotoText}>Remove photo</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.photoPlaceholder} onPress={() => onPickPhoto(index)}>
                    <Feather name="camera" size={20} color={COLORS.placeholder} />
                    <Text style={styles.photoPlaceholderText}>Add a phto for this step</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    block: {
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    numBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.green,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numText: {
        fontFamily: FONTS.serif,
        fontSize: FONT_SIZES.sm,
        color: COLORS.white,
        fontWeight: '700',
    },
    stepLabel: {
        fontFamily: FONTS.sansMed,
        fontSize: FONT_SIZES.base,
        color: COLORS.ink,
        flex: 1,
    },
    removeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.warm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeIcon: {
        fontSize: 11,
        color: COLORS.muted,
        fontFamily: FONTS.sansBold,
    },
    textarea: {
        backgroundColor: COLORS.card,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 12,
        fontFamily: FONT_SIZES.base,
        color: COLORS.ink,
        minHeight: 80,
        marginBottom: 8,
    },
    photoWrap: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: 160,
        resizeMode: 'mode',
        borderRadius: 10,
    },
    removePhotoBtn: {
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    removePhotoText: {
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.xs,
        color: COLORS.orange,
    },
    photoPlaceholder: {
        height: 80,
        borderRadius: 10,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: COLORS.border,
        backgroundColor: COLORS.warm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    photoPlaceholderIcon: {
        fontSize: 20
    },
    photoPlaceholderText: {
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.sm,
        color: COLORS.muted,
    },
});