import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Image, FlatList, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';
import { showToast } from '../components/Toast';
import { formatTime } from '../utils/format';

// ─── Data ────────────────────────────────────────────────────────────────────

const INGREDIENT_GROUPS = [
    {
        label: 'Proteins',
        icon: 'egg',
        richColor: '#C2B280', // Realistic Egg/Beige
        lightColor: '#FEE2E2', // Soft Rose
        items: ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'tofu', 'eggs', 'salmon', 'tuna'],
    },
    {
        label: 'Carbs',
        icon: 'restaurant',
        richColor: '#C4622A',
        lightColor: '#FFEDD5',
        items: ['rice', 'pasta', 'bread', 'noodles', 'potatoes', 'flour', 'oats'],
    },
    {
        label: 'Vegetables',
        icon: 'leaf',
        richColor: '#2D5016',
        lightColor: '#DCFCE7',
        items: ['tomato', 'onion', 'garlic', 'carrot', 'broccoli', 'spinach', 'bell pepper', 'mushroom', 'cabbage', 'cucumber'],
    },
    {
        label: 'Dairy',
        icon: 'water',
        richColor: '#3B82F6',
        lightColor: '#DBEAFE',
        items: ['milk', 'butter', 'cheese', 'cream', 'yogurt'],
    },
    {
        label: 'Pantry',
        icon: 'archive',
        richColor: '#D4A53A',
        lightColor: '#FEF3C7',
        items: ['olive oil', 'soy sauce', 'salt', 'pepper', 'sugar', 'vinegar', 'lemon', 'vanilla', 'chocolate', 'honey'],
    },
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

const getCategoryColor = (ingredient) => {
    const group = INGREDIENT_GROUPS.find(g => g.items.includes(ingredient));
    return group ? group.richColor : COLORS.green;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function IngredientTag({ ingredient, onRemove }) {
    return (
        <View style={[styles.tag, { backgroundColor: getCategoryColor(ingredient) }]}>
            <Text style={styles.tagText}>{ingredient}</Text>
            <TouchableOpacity onPress={() => onRemove(ingredient)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Feather name="x" size={12} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    );
}


// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function IngredientFilterScreen({ navigation }) {
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [customInput, setCustomInput] = useState('');
    const [activeGroup, setActiveGroup] = useState(null);


    // ── Ingredient management ──────────────────────────────────────────────────

    const toggleIngredient = useCallback((ing) => {
        setSelectedIngredients(prev =>
            prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
        );
    }, []);

    const removeIngredient = useCallback((ing) => {
        setSelectedIngredients(prev => prev.filter(i => i !== ing));
    }, []);

    const addCustomIngredient = () => {
        const trimmed = customInput.trim().toLowerCase();
        if (!trimmed) return;
        if (!selectedIngredients.includes(trimmed)) {
            setSelectedIngredients(prev => [...prev, trimmed]);
        }
        setCustomInput('');
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name="chevron-left" size={26} color={COLORS.ink} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.eyebrow}>DISCOVER</Text>
                        <Text style={styles.title}>What's in your{'\n'}kitchen?</Text>
                    </View>
                </View>

                <Text style={styles.description}>
                    Pick the ingredients you have on hand and we'll find all matching recipes.
                </Text>

                {/* ── Custom ingredient input ── */}
                <View style={styles.customInputRow}>
                    <View style={styles.customInputBox}>
                        <Feather name="plus-circle" size={16} color={COLORS.muted} />
                        <TextInput
                            style={styles.customInput}
                            placeholder="Type a custom ingredient..."
                            placeholderTextColor={COLORS.placeholder}
                            value={customInput}
                            onChangeText={setCustomInput}
                            returnKeyType="done"
                            onSubmitEditing={addCustomIngredient}
                        />
                        {customInput.trim() ? (
                            <TouchableOpacity
                                onPress={addCustomIngredient}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <View style={styles.addBtn}>
                                    <Text style={styles.addBtnText}>Add</Text>
                                </View>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {/* ── Sticky Selection Row ── */}
                {selectedIngredients.length > 0 && (
                    <View style={styles.stickySelectionContainer}>
                        <FlatList
                            horizontal
                            data={selectedIngredients}
                            renderItem={({ item }) => (
                                <IngredientTag key={item} ingredient={item} onRemove={removeIngredient} />
                            )}
                            keyExtractor={(item) => item}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.stickySelectionContent}
                        />
                    </View>
                )}

                {/* ── Ingredient Groups ── */}
                {INGREDIENT_GROUPS.map((group) => {
                    const isOpen = activeGroup === group.label;
                    return (
                        <View key={group.label} style={styles.group}>
                            <TouchableOpacity
                                style={styles.groupHeader}
                                onPress={() => setActiveGroup(isOpen ? null : group.label)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={group.icon} size={18} color={group.richColor} />
                                <Text style={[styles.groupLabel, { color: group.richColor }]}>{group.label}</Text>
                                <Feather
                                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                                    size={16}
                                    color={group.richColor}
                                />
                            </TouchableOpacity>

                            {isOpen && (
                                <View style={styles.groupChips}>
                                    {group.items.map((ing) => {
                                        const selected = selectedIngredients.includes(ing);
                                        return (
                                            <TouchableOpacity
                                                key={ing}
                                                style={[styles.chip, { backgroundColor: selected ? COLORS.green : group.lightColor }, selected && styles.chipSelected]}
                                                onPress={() => toggleIngredient(ing)}
                                                activeOpacity={0.8}
                                            >
                                                {selected && <Feather name="check" size={11} color={COLORS.white} />}
                                                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                                    {ing}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* ── Search button ── */}
                <View style={styles.footerContainer}>
                    <TouchableOpacity
                        style={[
                            styles.searchBtn,
                            selectedIngredients.length === 0 && styles.searchBtnDisabled,
                        ]}
                        onPress={() => {
                            if (selectedIngredients.length === 0) {
                                showToast('Select at least one ingredient', 'error');
                                return;
                            }
                            navigation.navigate('IngredientResults', { ingredients: selectedIngredients });
                        }}
                        disabled={selectedIngredients.length === 0}
                    >
                        <>
                            <Feather name="search" size={16} color={COLORS.white} />
                            <Text style={styles.searchBtnText}>
                                Find Recipes{selectedIngredients.length > 0 ? ` (${selectedIngredients.length} ingredient${selectedIngredients.length !== 1 ? 's' : ''})` : ''}
                            </Text>
                        </>
                    </TouchableOpacity>
                </View>

                {/* ── Tips (always shown) ── */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>How it works</Text>
                    <View style={styles.tipRow}>
                        <Text style={styles.tipNum}>1</Text>
                        <Text style={styles.tipText}>Tap a category to expand it and pick your ingredients</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Text style={styles.tipNum}>2</Text>
                        <Text style={styles.tipText}>Type any ingredient not listed in the box above</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Text style={styles.tipNum}>3</Text>
                        <Text style={styles.tipText}>Recipes are ranked by how many of your ingredients they use</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Text style={styles.tipNum}>4</Text>
                        <Text style={styles.tipText}>Green badge = great match · Yellow = partial · Red = low match</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F7F5' },
    content: { paddingHorizontal: 16, paddingBottom: 160 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingBottom: 16,
    },
    eyebrow: {
        fontFamily: FONTS.sansBold,
        fontSize: FONT_SIZES.xs,
        color: COLORS.muted,
        letterSpacing: 1.8,
        marginBottom: 4,
        opacity: 0.7,
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: 26,
        lineHeight: 28,
        color: COLORS.ink,
    },
    settingsBtn: {
        backgroundColor: 'white',
        borderRadius: 22,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.sm,
    },
    description: {
        fontFamily: FONTS.sans,
        fontSize: 13,
        color: COLORS.muted,
        lineHeight: 19,
        marginBottom: 20,
    },


    // Custom input
    customInputRow: { marginBottom: 12 },
    customInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 28,
        paddingHorizontal: 16,
        paddingVertical: 12,
        ...SHADOWS.sm,
    },
    customInput: {
        flex: 1,
        fontFamily: FONTS.sans,
        fontSize: 14,
        color: COLORS.ink,
    },

    addBtn: {
        backgroundColor: COLORS.green,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    addBtnText: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
        color: COLORS.white,
    },

    // Groups
    group: {
        borderRadius: 24,
        marginBottom: 16,
        overflow: 'hidden',
        ...SHADOWS.sm,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    groupIcon: { fontSize: 18 },
    groupLabel: {
        flex: 1,
        fontFamily: FONTS.sansMed,
        fontSize: 14,
        color: COLORS.ink,
    },
    groupChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 14,
        paddingBottom: 14,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 50,
        borderWidth: 1,
    },
    chipSelected: {
        backgroundColor: COLORS.green,
        borderColor: COLORS.green,
    },
    chipText: {
        fontFamily: FONTS.sansMed,
        fontSize: 12,
        textTransform: 'capitalize',
    },
    chipTextSelected: { color: COLORS.white },

    // Selected tags
    selectedSection: { marginVertical: 16 },
    sectionLabel: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
        color: COLORS.ink,
        letterSpacing: 0.8,
        marginBottom: 12,
        opacity: 0.8,
    },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 50,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    tagText: {
        fontFamily: FONTS.sansMed,
        fontSize: 12,
        color: COLORS.white,
        textTransform: 'capitalize',
    },
    stickySelectionContainer: {
        paddingVertical: 12,
        paddingHorizontal: 0,
        marginBottom: 16,
    },
    stickySelectionContent: {
        gap: 8,
        paddingHorizontal: -16, // offset container padding to allow full width scroll
    },
    // Search button
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(247, 247, 245, 0.8)',
        paddingHorizontal: 16,
        paddingBottom: 34, // Space for home indicator on modern devices
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
    },
    searchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#2D5016',
        borderRadius: 50,
        paddingVertical: 20,
        paddingHorizontal: 32,
        ...SHADOWS.lg,
    },
    searchBtnDisabled: { backgroundColor: 'rgba(45, 80, 22, 0.4)' },
    searchBtnText: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
        color: COLORS.white,
    },

    // Results
    resultsSection: { marginTop: 4 },
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    resultsTitle: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
        color: COLORS.ink,
    },
    resultsCount: {
        fontFamily: FONTS.sansMed,
        fontSize: 11,
        color: COLORS.muted,
        backgroundColor: COLORS.card,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    // Recipe result card
    resultCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
        ...SHADOWS.sm,
    },
    resultImage: {
        width: 110,
        height: 110,
        backgroundColor: COLORS.warm,
    },
    matchBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    matchBadgeText: {
        fontFamily: FONTS.sansBold,
        fontSize: 10,
        color: COLORS.white,
    },
    resultBody: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    resultTitle: {
        fontFamily: FONTS.serifMed,
        fontSize: 13,
        color: COLORS.ink,
        marginBottom: 4,
    },
    resultDesc: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        color: COLORS.muted,
        lineHeight: 15,
        marginBottom: 6,
    },
    resultMeta: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontFamily: FONTS.sansMed, fontSize: 10, color: COLORS.muted },
    matchInfo: { fontFamily: FONTS.sansMed, fontSize: 10, marginTop: 2 },

    // Load more
    loadMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        marginTop: 4,
        marginBottom: 12,
    },
    loadMoreText: { fontFamily: FONTS.sansMed, fontSize: 13, color: COLORS.green },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontFamily: FONTS.sansBold, fontSize: 15, color: COLORS.ink, marginBottom: 6 },
    emptyText: {
        fontFamily: FONTS.sans,
        fontSize: 13,
        color: COLORS.muted,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 220,
        marginBottom: 20,
    },
    browseBtn: {
        backgroundColor: COLORS.green,
        borderRadius: 50,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    browseBtnText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.white },

    // Tips
    tipsCard: {
        backgroundColor: COLORS.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginTop: 16,
        gap: 12,
    },
    tipsTitle: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.ink, marginBottom: 4 },
    tipRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    tipNum: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.green,
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: FONTS.sansBold,
        fontSize: 11,
        color: COLORS.white,
        flexShrink: 0,
    },
    tipText: {
        flex: 1,
        fontFamily: FONTS.sans,
        fontSize: 12,
        color: COLORS.muted,
        lineHeight: 17,
    },
});