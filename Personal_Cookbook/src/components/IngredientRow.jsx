import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';

export default function IngredientRow({ ingredient, index, onChange, onRemove }){
    return(
        <View style={styles.row}>
            {/* Drag handle visual */}
            <View style={styles.handle}>
                <View style={styles.handleDot} />
                <View style={styles.handleDot} />
                <View style={styles.handleDot} />
                <View style={styles.handleDot} />
                <View style={styles.handleDot} />
                <View style={styles.handleDot} />
            </View>

            {/* Quantity */}
            <TextInput
                style={styles.qtyInput}
                value={ingredient.qty}
                onChangeText={(v) => onChange(index, 'qty', v)}
                placeholder="Quantity"
                placeholderTextColor={COLORS.placeholder}
            />

            {/* Name */}
            <TextInput
                style={styles.nameInput}
                value={ingredient.name}
                onChangeText={(v) => onChange(index, 'name', v)}
                placeholder="Ingredient name..."
                placeholderTextColor={COLORS.placeholder}
            />

            {/* Remove */}
            <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color={COLORS.muted} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        borderBottomColor: COLORS.border,
        borderBottomWidth: 1,
    },
    handle: {
        width: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        paddingRight: 2,
    },
    handleDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.border,
    },
    qtyInput: {
        width: 72,
        backgroundColor: COLORS.warm,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.sm,
        color: COLORS.ink,
    },
    nameInput: {
        flex: 1,
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.base,
        color: COLORS.ink,
        paddingVertical: 8,
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
});