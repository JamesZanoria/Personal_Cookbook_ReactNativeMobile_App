import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';
import { formatTime } from '../utils/format';
import { DIFFICULTY_COLORS } from '../constants/categories'

export default function RecipeCard({ recipe, onPress, onToggleSave, style }){
    const diff = DIFFICULTY_COLORS[recipe.difficulty];

    return(
        <TouchableOpacity style={[styles.card, style]} onPress={() => onPress(recipe)} activeOpacity={0.92}>
            {/* image */}
            <View style={styles.imageWrap}>
                {recipe.photo_url ? (
                    <Image source={{ uri: recipe.photo_url }} style={styles.image} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Feather name="image" size={40} color={COLORS.placeholder} />
                    </View>
                )}

                {/* Overlay shade */}
                <View style={styles.imageOverlay} />

                {/* Save button */}
                {onToggleSave && (
                    <TouchableOpacity style={[styles.saveBtn, recipe.is_saved && styles.saveBtnActive]}
                        onPress={() => onToggleSave(recipe.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name={recipe.is_saved ? 'bookmark' : 'bookmark-outline'} size={16} color={COLORS.white} />
                    </TouchableOpacity>
                )}

                {/* Tags */}
                <View style={styles.tagsRow}>
                    {recipe.category && (
                        <View style={styles.tagGreen}>
                            <Text style={styles.tagText}>{recipe.category}</Text>
                        </View>
                    )}
                    {recipe.difficulty && diff && (
                        <View style={[styles.tagDiff, { backgroundColor: diff.bg }]}>
                            <Text style={[styles.tagText, {color:diff.text }]}>{recipe.difficulty}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Body */}
            <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>

                {recipe.story ? (
                    <Text style={styles.story} numberOfLines={2}>{recipe.story}</Text>
                ) : null}

                {/* Meta row */}
                <View style={styles.metaRow}>
                    {recipe.cook_time ? (
                        <View style={styles.metaItem}>
                            <Feather name="clock" size={12} color={COLORS.muted} />
                            <Text style={styles.metaText}>{formatTime(recipe.cook_time)}</Text>
                        </View>
                    ) : null}
                    {recipe.servings ? (
                        <View style={styles.metaItem}>
                            <Ionicons name="people" size={12} color={COLORS.muted} />
                            <Text style={styles.metaText}>{recipe.servings}</Text>
                        </View>
                    ) : null}
                    {recipe.avg_rating ? (
                        <View style={styles.metaItem}>
                            <Ionicons name="star" size={12} color={COLORS.gold} />
                            <Text style={styles.metaText}>{recipe.avg_rating}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 16,
        ...SHADOWS.md,
    },
    imageWrap: {
        position: 'relative',
        height: 200,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.warm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderEmoji: {
        fontSize: 48
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'transparent',
    },
    saveBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnActive: {
        backgroundColor: COLORS.green,
    },
    saveIcon: {
        fontSize: 14
    },
    tagsRow: {
        position: 'absolute',
        bottom: 10,
        left: 12,
        flexDirection: 'row',
        gap: 6,
    },
    tagGreen: {
        backgroundColor: COLORS.green,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    tagDiff: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 20,
    },
    tagText: {
        fontFamily: FONTS.sansBold,
        fontSize: FONT_SIZES.xs,
        color: COLORS.white,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    body: {
        padding: 14,
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: FONT_SIZES.lg,
        color: COLORS.ink,
        marginBottom: 4,
        lineHeight: FONT_SIZES.lg * 1.3,
    },
    story: {
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.sm,
        color: COLORS.muted,
        lineHeight: FONT_SIZES.sm * 1.5,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 14,
        flexWrap: 'wrap',
    },
    meta: {
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.xs,
        color: COLORS.muted,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.xs,
        color: COLORS.muted,
    },
});