import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, SectionList, FlatList, Image, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { searchAPI } from '../api/search';
import { showToast } from '../components/Toast';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';
import { formatTime } from '../utils/format';

const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
const PAGE_SIZE = 12;

// ─── Utilities ────────────────────────────────────────────────────────────────

function getMatchColor(pct) {
    if (pct >= 80) return COLORS.success;
    if (pct >= 50) return COLORS.warning;
    return COLORS.danger;
}

function getSourceLabel(source) {
    if (source === 'local')  return { label: 'In-App',  icon: 'home',  bg: COLORS.greenLight, border: '#BBF7D0', color: COLORS.success };
    if (source === 'mealdb') return { label: 'MealDB',  icon: 'globe', bg: COLORS.warm, border: '#FED7AA', color: COLORS.orange };
    return                          { label: 'Web',     icon: 'globe', bg: COLORS.warm, border: COLORS.border, color: COLORS.muted };
}

// ─── Recipe result card ───────────────────────────────────────────────────────

function RecipeCard({ recipe, onPress }) {
    const pct        = Math.round(recipe.matchPercentage ?? 0);
    const matchColor = getMatchColor(pct);
    const src        = getSourceLabel(recipe.source);

    return (
        <TouchableOpacity style={card.wrap} onPress={() => onPress(recipe)} activeOpacity={0.92}>
            {/* Cover image */}
            <View style={card.imageWrap}>
                <Image
                    source={{ uri: recipe.photo_url || recipe.image || FALLBACK }}
                    style={card.image}
                    resizeMode="cover"
                />
                {/* Gradient-style overlay at bottom */}
                <View style={card.imageOverlay} />

                {/* Match % chip on image */}
                <View style={[card.matchChip, { backgroundColor: matchColor }]}>
                    <Ionicons name="checkmark-circle" size={11} color="#fff" />
                    <Text style={card.matchChipText}>{pct}% match</Text>
                </View>

                {/* Source chip on image */}
                <View style={[card.sourceChip, { backgroundColor: src.bg, borderColor: src.border }]}>
                    <Feather name={src.icon} size={9} color={src.color} />
                    <Text style={[card.sourceChipText, { color: src.color }]}>{src.label}</Text>
                </View>
            </View>

            {/* Body */}
            <View style={card.body}>
                <Text style={card.title} numberOfLines={2}>{recipe.title}</Text>

                {recipe.summary ? (
                    <Text style={card.summary} numberOfLines={2}>{recipe.summary}</Text>
                ) : null}

                {/* Meta chips */}
                <View style={card.metaRow}>
                    {(recipe.cook_time || recipe.readyInMinutes) ? (
                        <View style={card.metaChip}>
                            <Feather name="clock" size={10} color={COLORS.muted} />
                            <Text style={card.metaChipText}>
                                {formatTime(recipe.cook_time || recipe.readyInMinutes)}
                            </Text>
                        </View>
                    ) : null}
                    {recipe.servings ? (
                        <View style={card.metaChip}>
                            <Feather name="users" size={10} color={COLORS.muted} />
                            <Text style={card.metaChipText}>{recipe.servings} servings</Text>
                        </View>
                    ) : null}
                    {recipe.category ? (
                        <View style={card.metaChip}>
                            <Feather name="tag" size={10} color={COLORS.muted} />
                            <Text style={card.metaChipText}>{recipe.category}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Ingredient match breakdown */}
                {recipe.usedIngredients?.length > 0 && (
                    <View style={card.ingSection}>
                        <View style={card.ingRow}>
                            <View style={[card.ingDot, { backgroundColor: COLORS.success }]} />
                            <Text style={card.ingUsed} numberOfLines={1}>
                                {recipe.usedIngredients.slice(0, 4).join(', ')}
                                {recipe.usedIngredients.length > 4 ? ` +${recipe.usedIngredients.length - 4}` : ''}
                            </Text>
                        </View>
                        {recipe.missedIngredients?.length > 0 && (
                            <View style={card.ingRow}>
                                <View style={[card.ingDot, { backgroundColor: COLORS.danger }]} />
                                <Text style={card.ingMissed} numberOfLines={1}>
                                    Need: {recipe.missedIngredients.slice(0, 3).join(', ')}
                                    {recipe.missedIngredients.length > 3 ? ` +${recipe.missedIngredients.length - 3}` : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={card.footer}>
                    <Text style={card.author}>By {recipe.author_name || 'Anonymous'}</Text>
                    {recipe.source !== 'local' && (
                        <View style={card.externalHint}>
                            <Feather name="external-link" size={10} color={COLORS.muted} />
                            <Text style={card.externalText}>Opens externally</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const card = StyleSheet.create({
    wrap: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.md,
    },
    imageWrap:    { position: 'relative', height: 200 },
    image:        { width: '100%', height: '100%' },
    imageOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    matchChip: {
        position: 'absolute', top: 12, left: 12,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    },
    matchChipText: { fontFamily: FONTS.sansBold, fontSize: 10, color: '#fff' },
    sourceChip: {
        position: 'absolute', top: 12, right: 12,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
        borderWidth: 1,
    },
    sourceChipText: { fontFamily: FONTS.sansBold, fontSize: 9 },
    body:    { padding: 16 },
    title:   { fontFamily: FONTS.serifMed, fontSize: 17, color: COLORS.ink, marginBottom: 5, lineHeight: 22 },
    summary: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted, lineHeight: 17, marginBottom: 10 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    metaChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.warm, borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 4,
    },
    metaChipText: { fontFamily: FONTS.sansMed, fontSize: 10, color: COLORS.muted },
    ingSection: { gap: 4, marginBottom: 10, padding: 10, backgroundColor: COLORS.warm, borderRadius: 10 },
    ingRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ingDot:   { width: 6, height: 6, borderRadius: 3 },
    ingUsed:  { flex: 1, fontFamily: FONTS.sansMed, fontSize: 11, color: COLORS.success },
    ingMissed: { flex: 1, fontFamily: FONTS.sans, fontSize: 11, color: COLORS.danger },
    footer:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    author:       { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.muted },
    externalHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    externalText: { fontFamily: FONTS.sans, fontSize: 10, color: COLORS.muted },
});

function SortChips({ current, onSelect }) {
    const options = [
        { id: 'best', label: 'Best Match' },
        { id: 'fewest', label: 'Fewest Missing' },
        { id: 'fastest', label: 'Fastest' },
        { id: 'trending', label: 'Trending' },
    ];

    return (
        <View style={styles.sortBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt.id}
                        style={[styles.sortChip, current === opt.id && styles.sortChipActive]}
                        onPress={() => onSelect(opt.id)}
                    >
                        <Text style={[styles.sortChipText, current === opt.id && styles.sortChipTextActive]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

// ─── List Header ──────────────────────────────────────────────────────────────

function ListHeader({ ingredients, total, loading, sortOption, onSortChange }) {
    return (
        <View style={header.wrap}>
            <Text style={header.eyebrow}>INGREDIENT SEARCH</Text>
            <Text style={header.title}>Recipes for{'\n'}your kitchen</Text>

            <View style={header.tagRow}>
                {/* Ingredient tags removed as per user request */}
            </View>

            {!loading && total != null && (
                <View style={header.countRow}>
                    <View style={header.countPill}>
                        <Ionicons name="restaurant" size={12} color={COLORS.green} />
                        <Text style={header.countText}>
                            {total} recipe{total !== 1 ? 's' : ''} found
                        </Text>
                    </View>
                    <Text style={header.countNote}>From your app + TheMealDB worldwide</Text>
                </View>
            )}
        </View>
    );
}

const header = StyleSheet.create({
    wrap:    { paddingTop: 20, paddingBottom: 24 },
    eyebrow: { fontFamily: FONTS.sansBold, fontSize: 9, letterSpacing: 1.4, color: COLORS.green, marginBottom: 6 },
    title:   { fontFamily: FONTS.serif, fontSize: 34, lineHeight: 36, color: COLORS.ink, marginBottom: 16 },
    tagRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
    tag: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: COLORS.green, borderRadius: 50,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    tagText: { fontFamily: FONTS.sansMed, fontSize: 12, color: COLORS.white, textTransform: 'capitalize' },
    countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    countPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: COLORS.greenLight, borderRadius: 50,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: '#C6E2A6',
    },
    countText: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.green },
    countNote: { fontFamily: FONTS.sans, fontSize: 10, color: COLORS.muted },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ ingredients, onBack }) {
    return (
        <View style={empty.wrap}>
            <Ionicons name="alert-circle" size={56} color={COLORS.muted} />
            <Text style={empty.title}>No recipes found</Text>
            <Text style={empty.text}>
                No recipes matched{' '}
                <Text style={{ fontFamily: FONTS.sansBold, color: COLORS.ink }}>
                    {ingredients.join(', ')}
                </Text>
                .{'\n'}Try different or additional ingredients.
            </Text>
            <TouchableOpacity style={empty.btn} onPress={onBack}>
                <Feather name="arrow-left" size={14} color={COLORS.white} />
                <Text style={empty.btnText}>Change Ingredients</Text>
            </TouchableOpacity>
        </View>
    );
}

const empty = StyleSheet.create({
    wrap:  { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
    title: { fontFamily: FONTS.sansBold, fontSize: 18, color: COLORS.ink, marginBottom: 10 },
    text:  { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    btn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.green, borderRadius: 50,
        paddingHorizontal: 20, paddingVertical: 12,
    },
    btnText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.white },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function IngredientResultsScreen({ route, navigation }) {
    const ingredients = route.params?.ingredients ?? [];

    const [recipes,     setRecipes]     = useState([]);
    const [pagination,  setPagination]  = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error,       setError]       = useState(null);
    const [sortOption,  setSortOption]  = useState('best'); // 'best', 'fewest', 'fastest', 'trending'

    const currentPage = useRef(1);
    const isFetching  = useRef(false);

    const handleRecipePress = useCallback((recipe) => {
        if (recipe.source === 'local') {
            navigation.navigate('Detail', { recipeId: recipe.id });
        } else if (recipe.sourceUrl) {
            Linking.openURL(recipe.sourceUrl).catch(() =>
                showToast('Could not open this recipe', 'error')
            );
        }
    }, [navigation]);

    const renderItem = useCallback(({ item }) => (
        <RecipeCard recipe={item} onPress={handleRecipePress} />
    ), [handleRecipePress]);

    const renderSectionHeader = useCallback(({ section: { title } }) => (
        <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeader}>{title}</Text>
        </View>
    ), []);

    const fetchPage = useCallback(async (page) => {
        if (isFetching.current) return;
        isFetching.current = true;
        try {
            const response = await searchAPI.byIngredients(ingredients, page, 10);
            const { data, pagination: pg } = response;
            setRecipes(prev => page === 1 ? data : [...prev, ...data]);
            setPagination(pg);
            currentPage.current = pg.page + 1;
        } catch (err) {
            setError(err.message);
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetching.current = false;
        }
    }, [ingredients]);

    useEffect(() => {
        if (ingredients.length === 0) { setLoading(false); return; }
        fetchPage(1);
    }, []);

    const handleLoadMore = useCallback(() => {
        // We removed the auto-check from onEndReached to use a manual button,
        // but the logic for fetching remains the same.
        if (!pagination?.hasMore || loadingMore || loading) return;
        setLoadingMore(true);
        fetchPage(currentPage.current);
    }, [fetchPage, loading, loadingMore, pagination?.hasMore]);

    const sortedAndPartitioned = useMemo(() => {
        if (!recipes.length) return { canMake: [], almostPossible: [] };

        // 1. Apply Sorting
        const sorted = [...recipes].sort((a, b) => {
            if (sortOption === 'fewest') {
                return (a.missedIngredients?.length || 0) - (b.missedIngredients?.length || 0);
            }
            if (sortOption === 'fastest') {
                const timeA = a.cook_time || a.readyInMinutes || 999;
                const timeB = b.cook_time || b.readyInMinutes || 999;
                return timeA - timeB;
            }
            if (sortOption === 'trending') {
                const scoreA = (a.like_count || 0) + (a.avg_rating || 0) * 5;
                const scoreB = (b.like_count || 0) + (b.avg_rating || 0) * 5;
                return scoreB - scoreA;
            }
            // Default: Best Match (matchPercentage)
            return (b.matchPercentage || 0) - (a.matchPercentage || 0);
        });

        // 2. Partition into sections
        const canMake = sorted.filter(r => (r.missedIngredients?.length || 0) === 0);
        const almostPossible = sorted.filter(r => (r.missedIngredients?.length || 0) > 0);

        return { canMake, almostPossible };
    }, [recipes, sortOption]);

    const sectionData = useMemo(() => {
        const data = [];
        if (sortedAndPartitioned.canMake.length > 0) {
            data.push({
                title: 'Recipes you can make',
                data: sortedAndPartitioned.canMake,
                type: 'canMake'
            });
        }
        if (sortedAndPartitioned.almostPossible.length > 0) {
            data.push({
                title: 'Recipes almost possible',
                data: sortedAndPartitioned.almostPossible,
                type: 'almostPossible'
            });
        }
        return data;
    }, [sortedAndPartitioned]);

    const keyExtractor = useCallback((item) => item.id?.toString() || Math.random().toString(), []);

    const renderListFooter = useCallback(() => {
        if (loadingMore) return (
            <View style={styles.footerRow}>
                <ActivityIndicator color={COLORS.green} size="small" />
                <Text style={styles.footerText}>Finding more recipes…</Text>
            </View>
        );
        if (!pagination?.hasMore && recipes.length > 0) return (
            <View style={styles.footerEnd}>
                <View style={styles.footerLine} />
                <Text style={styles.footerEndText}>
                    All {pagination?.total ?? recipes.length} recipes shown
                </Text>
                <View style={styles.footerLine} />
            </View>
        );
        if (pagination?.hasMore) return (
            <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={handleLoadMore}
                activeOpacity={0.8}
            >
                <Text style={styles.loadMoreText}>Load More Recipes</Text>
            </TouchableOpacity>
        );
        return null;
    }, [loadingMore, pagination, recipes.length, handleLoadMore]);

    // ── Full-screen loader ────────────────────────────────────────────────────

    if (loading) return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.navBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="chevron-left" size={22} color={COLORS.ink} />
                    <Text style={styles.backText}>Discover</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.loader}>
                <View style={styles.loaderCard}>
                    <Feather name="search" size={48} color={COLORS.ink} />
                    <ActivityIndicator color={COLORS.green} size="large" style={{ marginBottom: 14 }} />
                    <Text style={styles.loaderTitle}>Searching recipes…</Text>
                    <Text style={styles.loaderSub}>
                        Checking your app + thousands of{'\n'}real-world recipes from TheMealDB
                    </Text>
                    <View style={styles.loaderTags}>
                        {ingredients.map(ing => (
                            <View key={ing} style={styles.loaderTag}>
                                <Text style={styles.loaderTagText}>{ing}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );

    // ── Error ─────────────────────────────────────────────────────────────────

    if (error) return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.navBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="chevron-left" size={22} color={COLORS.ink} />
                    <Text style={styles.backText}>Discover</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.loader}>
                <View style={styles.loaderCard}>
                    <Feather name="alert-triangle" size={48} color={COLORS.red} />
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorMsg}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => { setError(null); setLoading(true); fetchPage(1); }}
                    >
                        <Feather name="refresh-cw" size={14} color={COLORS.white} />
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );

    // ── Results ───────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Nav bar */}
            <View style={styles.navBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="chevron-left" size={22} color={COLORS.ink} />
                    <Text style={styles.backText}>Discover</Text>
                </TouchableOpacity>
                {pagination && (
                    <View style={styles.totalPill}>
                        <Text style={styles.totalPillText}>{pagination.total} recipes</Text>
                    </View>
                )}
            </View>

            <SectionList
                sections={sectionData}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <ListHeader
                        ingredients={ingredients}
                        total={pagination?.total}
                        loading={loading}
                        sortOption={sortOption}
                        onSortChange={setSortOption}
                    />
                }
                ListEmptyComponent={
                    <EmptyState ingredients={ingredients} onBack={() => navigation.goBack()} />
                }
                ListFooterComponent={renderListFooter}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.cream },

    navBar: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
        backgroundColor: COLORS.cream,
    },
    backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    backText: { fontFamily: FONTS.sansMed, fontSize: FONT_SIZES.sm, color: COLORS.ink },
    totalPill: {
        backgroundColor: COLORS.greenLight, borderRadius: 50,
        paddingHorizontal: 12, paddingVertical: 5,
        borderWidth: 1, borderColor: '#C6E2A6',
    },
    totalPillText: { fontFamily: FONTS.sansBold, fontSize: 10, color: COLORS.green },

    list: { paddingHorizontal: 16, paddingBottom: 100 },

    // Loading card
    loader:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    loaderCard: {
        backgroundColor: COLORS.white, borderRadius: 24,
        padding: 28, alignItems: 'center', width: '100%',
        ...SHADOWS.md,
    },
    loaderEmoji: { fontSize: 48, marginBottom: 16 },
    loaderTitle: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.ink, marginBottom: 6 },
    loaderSub:   { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
    loaderTags:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
    loaderTag: {
        backgroundColor: COLORS.greenLight, borderRadius: 50,
        paddingHorizontal: 12, paddingVertical: 5,
    },
    loaderTagText: { fontFamily: FONTS.sansMed, fontSize: 11, color: COLORS.green, textTransform: 'capitalize' },

    // Error
    errorTitle: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.ink, marginBottom: 8 },
    errorMsg:   { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.red, textAlign: 'center', marginBottom: 16 },
    retryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.green, borderRadius: 50,
        paddingHorizontal: 20, paddingVertical: 12,
    },
    retryText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.white },

    // Footer
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
    footerText: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.muted },
    footerEnd: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 8 },
    footerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    footerEndText: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.muted },
    loadMoreBtn: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20,
        ...SHADOWS.sm,
    },
    loadMoreText: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
        color: COLORS.green,
    },
    sortBar: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
        paddingBottom: 8,
    },
    sortChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sortChipActive: {
        backgroundColor: COLORS.green,
        borderColor: COLORS.green,
    },
    sortChipText: {
        fontFamily: FONTS.sansMed,
        fontSize: 11,
        color: COLORS.muted,
    },
    sortChipTextActive: {
        color: COLORS.white,
    },
    sectionHeaderWrap: {
        backgroundColor: COLORS.cream,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        fontFamily: FONTS.sansBold,
        fontSize: 16,
        color: COLORS.ink,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
});