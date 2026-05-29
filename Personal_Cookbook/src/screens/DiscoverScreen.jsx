import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, RefreshControl, FlatList, ActivityIndicator, ScrollView, Modal, Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRecipes } from '../hooks/useRecipes';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { CATEGORIES, CAT_ICONS } from '../constants/categories';
import { formatTime } from '../utils/format';
import { validateIngredient, getSuggestions } from '../utils/ingredientValidator';
import { showToast } from '../components/Toast';
import AppMenuSheet, { ProfileMenu } from '../components/AppMenuSheet';
import NotificationCenter from '../components/NotificationCenter';

const FALLBACK = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80';

const INGREDIENT_GROUPS = [
    { label: 'Proteins',   icon: 'egg',   items: ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'eggs', 'tofu', 'salmon'] },
    { label: 'Carbs',      icon: 'bread', items: ['rice', 'pasta', 'bread', 'noodles', 'potatoes', 'flour'] },
    { label: 'Vegetables', icon: 'leaf',  items: ['tomato', 'onion', 'garlic', 'carrot', 'broccoli', 'spinach', 'mushroom', 'bell pepper'] },
    { label: 'Dairy',      icon: 'milk',  items: ['milk', 'butter', 'cheese', 'cream', 'yogurt'] },
    { label: 'Pantry',     icon: 'package',items: ['olive oil', 'soy sauce', 'sugar', 'lemon', 'honey', 'vinegar', 'vanilla'] },
];

const ALL_VALID_INGREDIENTS = INGREDIENT_GROUPS.flatMap(group => group.items);

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

// ─── Featured card ────────────────────────────────────────────────────────────

function FeaturedCard({ recipe, onPress }) {
    if (!recipe) return null;
    return (
        <TouchableOpacity style={styles.featuredCard} onPress={() => onPress(recipe)} activeOpacity={0.92}>
            <Image source={{ uri: recipe.photo_url || FALLBACK }} style={styles.featuredImage} />
            <View style={styles.featuredOverlay} />

            <View style={styles.featuredBadge}>
                <View style={styles.badgeInner}>
                    <Text style={styles.featuredBadgeText}>EDITOR'S CHOICE</Text>
                </View>
            </View>

            <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle} numberOfLines={2}>{recipe.title}</Text>

                <Text style={styles.featuredHook} numberOfLines={2}>
                    {recipe.story ? recipe.story.substring(0, 80) + '...' : 'A curated masterpiece for your kitchen.'}
                </Text>

                <View style={styles.featuredMetrics}>
                    <View style={styles.metricItem}>
                        <Ionicons name="star" size={12} color={COLORS.gold} />
                        <Text style={styles.metricText}>{recipe.avg_rating || '0.0'}</Text>
                    </View>
                    <View style={styles.metricSeparator} />
                    <View style={styles.metricItem}>
                        <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.metricText}>{recipe.cook_time ? formatTime(recipe.cook_time) : '30 min'}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Regular recipe card ──────────────────────────────────────────────────────

function RecipeCard({ recipe, onPress, onToggleSave }) {
    return (
        <TouchableOpacity style={styles.recipeCard} onPress={() => onPress(recipe)} activeOpacity={0.94}>
            <Image source={{ uri: recipe.photo_url || FALLBACK }} style={styles.recipeImage} />
            <TouchableOpacity
                style={[styles.bookmarkBtn, recipe.is_saved && styles.bookmarkBtnActive]}
                onPress={() => onToggleSave(recipe.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                {recipe.is_saved
                    ? <Ionicons name="bookmark" size={14} color={COLORS.white} />
                    : <Feather name="bookmark" size={14} color={COLORS.white} />}
            </TouchableOpacity>
            <View style={styles.recipeBody}>
                <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                <Text style={styles.recipeDesc} numberOfLines={2}>
                    {recipe.story || `By ${recipe.author_name || 'Anonymous'}`}
                </Text>
                <View style={styles.recipeFooter}>
                    <View style={styles.metaItem}>
                        <Feather name="clock" size={11} color={COLORS.muted} />
                        <Text style={styles.metaText}>{recipe.cook_time ? formatTime(recipe.cook_time) : '-'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="heart" size={11} color={COLORS.orange} />
                        <Text style={styles.metaText}>{recipe.like_count || 0}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="star" size={11} color={COLORS.gold} />
                        <Text style={styles.metaText}>{recipe.avg_rating || 0}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Feather name="bookmark" size={11} color={recipe.is_saved ? COLORS.green : COLORS.muted} />
                        <Text style={[styles.metaText, recipe.is_saved && { color: COLORS.green }]}>{recipe.save_count || 0}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Category grid ────────────────────────────────────────────────────────────

function CategoryGrid({ recipes, activeCategory, onSelect }) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
        >
            {CATEGORIES.map(cat => (
                <TouchableOpacity
                    key={cat.key}
                    style={[
                        styles.catItem,
                        activeCategory === cat.key && styles.catItemActive
                    ]}
                    onPress={() => onSelect(activeCategory === cat.key ? null : cat.key)}
                    activeOpacity={0.8}
                >
                    <View style={styles.catIconBox}>
                        <Feather
                            name={CAT_ICONS[cat.label] || 'grid'}
                            size={28}
                            color={cat.iconColor || COLORS.ink}
                        />
                    </View>
                    <Text style={[
                        styles.catLabel,
                        activeCategory === cat.key && styles.catLabelActive
                    ]}>
                        {cat.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen({ navigation }) {
    const { user }           = useAuth();
    const [search,           setSearch]           = useState('');
    const [debouncedSearch,  setDebouncedSearch]  = useState('');
    const [showAllTrending,  setShowAllTrending]  = useState(false);
    const [currentInput,       setCurrentInput]       = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [showAllInvalidModal, setShowAllInvalidModal] = useState(false);
    const [menuVisible,      setMenuVisible]      = useState(false);
    const [profileMenuVisible, setProfileMenuVisible] = useState(false);
    const [notificationsVisible, setNotificationsVisible] = useState(false);
    const [overlayPos, setOverlayPos] = useState({ top: 0, left: 0, width: 0 });
    const [suggestionsVisible, setSuggestionsVisible] = useState(true);
    const searchRowRef = useRef(null);

    const confirmedIngredients = useMemo(() => {
        if (!currentInput) return [];
        const parts = currentInput.split(',').filter(p => p.trim());
        if (parts.length === 0) return [];

        const endsWithComma = currentInput.trim().endsWith(',');
        const itemsToValidate = endsWithComma ? parts : parts.slice(0, -1);

        return itemsToValidate.filter(p => {
            const { isValid } = validateIngredient(p.trim(), ALL_VALID_INGREDIENTS);
            return isValid;
        });
    }, [currentInput]);

    const warningIngredients = useMemo(() => {
        if (!currentInput) return [];
        const parts = currentInput.split(',').filter(p => p.trim());
        if (parts.length === 0) return [];

        const endsWithComma = currentInput.trim().endsWith(',');
        const itemsToValidate = endsWithComma ? parts : parts.slice(0, -1);

        return itemsToValidate.filter(p => {
            const { isValid } = validateIngredient(p.trim(), ALL_VALID_INGREDIENTS);
            return !isValid;
        });
    }, [currentInput]);

    const suggestions = useMemo(() => {
        const currentWord = currentInput.split(',').pop()?.trim() || '';
        return getSuggestions(currentWord, ALL_VALID_INGREDIENTS);
    }, [currentInput]);

    const debounceRef = useRef(null);
    const feedQuery   = useRecipes('feed');
    const savedQuery  = useRecipes('saved');

    useFocusEffect(
        useCallback(() => {
            feedQuery.refresh();
        }, [feedQuery.refresh])
    );

    const updateOverlayPos = useCallback(() => {
        if (searchRowRef.current) {
            searchRowRef.current.measure((x, y, width, height, pageX, pageY) => {
                setOverlayPos({
                    top: pageY + height,
                    left: pageX,
                    width: width,
                });
            });
        }
    }, []);

    useEffect(() => {
        if (currentInput.length > 0 && suggestions.length > 0) {
            updateOverlayPos();
        }
    }, [suggestions, updateOverlayPos]);

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    const handleSearch = useCallback((text) => {
        setSearch(text);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() =>
            setDebouncedSearch(text.trim().toLowerCase()), 250);
    }, []);

    const savedIds = useMemo(() =>
        new Set(savedQuery.recipes.map(r => r.id)), [savedQuery.recipes]);

    const allRecipes = useMemo(() =>
        feedQuery.recipes.map(r => ({
            ...r,
            is_saved: r.is_saved ?? savedIds.has(r.id)
        })),
        [feedQuery.recipes, savedIds]);

    const hasActiveFilter = Boolean(debouncedSearch || activeCategory);

    const filteredRecipes = useMemo(() =>
        allRecipes.filter(r => {
            const matchCat  = activeCategory ? r.category === activeCategory : true;
            const haystack  = [r.title, r.story, r.category, r.author_name]
                .filter(Boolean).join(' ').toLowerCase();
            return matchCat && (debouncedSearch ? haystack.includes(debouncedSearch) : true);
        }),
        [activeCategory, allRecipes, debouncedSearch]);

    const featured = allRecipes[0] || null;

    const allTrending = useMemo(() =>
        [...allRecipes]
            .filter(r => (r.avg_rating || 0) > 0 || (r.like_count || 0) > 0 || (r.save_count || 0) > 0)
            .sort((a, b) => {
                const sA = (a.avg_rating || 0) * 10 + (a.review_count || 0) * 3 + (a.like_count || 0) + (a.save_count || 0) * 2;
                const sB = (b.avg_rating || 0) * 10 + (b.review_count || 0) * 3 + (b.like_count || 0) + (b.save_count || 0) * 2;
                return sB - sA || new Date(b.created_at) - new Date(a.created_at);
            }),
        [allRecipes]);

    const visibleTrending = showAllTrending ? allTrending : allTrending.slice(0, 3);
    const savedRecipes    = savedQuery.recipes.slice(0, 4);

    const onPressRecipe = recipe => navigation.navigate('Detail', { recipeId: recipe.id });

    const addIngredient = useCallback((term) => {
        if (!term) return;
        const trimmed = term.trim();
        if (!trimmed) return;

        const { isValid, suggestion } = validateIngredient(trimmed, ALL_VALID_INGREDIENTS);

        if (isValid) {
            setFeedbackMessage(null);
        } else {
            setFeedbackMessage(suggestion ? { text: 'Did you mean ', highlight: suggestion, suffix: '?' } : { text: 'Unrecognized ingredient: ', highlight: trimmed, suffix: '' });
        }

        setCurrentInput(prev => prev ? `${prev.endsWith(',') ? prev : prev + ','} ${trimmed}, ` : `${trimmed}, `);
    }, []);

    const handleFinderInputChange = useCallback((text) => {
        setCurrentInput(text);
        if (text.length > 0) {
            setSuggestionsVisible(true);
        } else {
            setSuggestionsVisible(false);
        }
    }, []);

    const removeConfirmedIngredient = (ing) => {
        const parts = currentInput.split(',').filter(p => p.trim());
        const index = parts.findIndex(p => p.trim() === ing);
        if (index !== -1) {
            parts.splice(index, 1);
            const updatedInput = parts.length > 0
                ? parts.join(', ') + ', '
                : '';
            setCurrentInput(updatedInput);
        }
    };

    const removeWarningIngredient = (ing) => {
        const parts = currentInput.split(',').filter(p => p.trim());
        const index = parts.findIndex(p => p.trim() === ing);
        if (index !== -1) {
            parts.splice(index, 1);
            const updatedInput = parts.length > 0
                ? parts.join(', ') + ', '
                : '';
            setCurrentInput(updatedInput);
        }
    };

    const handleSuggestionClick = useCallback((suggestion) => {
        setFeedbackMessage(null);

        setCurrentInput(prev => {
            if (!prev) return `${suggestion}, `;
            const parts = prev.split(',');
            if (parts.length === 1) {
                return `${suggestion}, `;
            }
            const base = parts.slice(0, -1).join(',') + ',';
            return `${base} ${suggestion}, `;
        });
        setSuggestionsVisible(false);
    }, []);


    const handleToggleSave = async (id) => {
        try {
            const result = await feedQuery.toggleSave(id);
            if (savedQuery.refresh) await savedQuery.refresh();
            showToast(result.saved ? 'Saved to cookbook!' : 'Removed from cookbook');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // ── Build FlatList data ───────────────────────────────────────────────────

    const listData = useMemo(() => {
        const items = [
            { type: 'topbar' },
            { type: 'search' },
        ];

        if (hasActiveFilter) {
            filteredRecipes.length
                ? filteredRecipes.forEach(r => items.push({ type: 'filteredRecipe', recipe: r }))
                : items.push({ type: 'emptyFiltered' });
            return items;
        }

        if (featured) items.push({ type: 'featured', recipe: featured });
        items.push({ type: 'categories' });
        items.push({ type: 'ingredientFinder' });

        if (allTrending.length) {
            items.push({ type: 'trendingHeader' });
            visibleTrending.forEach(r => items.push({ type: 'recipeCard', recipe: r }));
        }

        return items;
    }, [allTrending.length, featured, filteredRecipes, hasActiveFilter, savedRecipes.length, visibleTrending]);

    // ── Render items ──────────────────────────────────────────────────────────

    const renderItem = useCallback(({ item }) => {
        switch (item.type) {

            case 'topbar':
                return (
                    <View style={styles.topBar}>
                        {hasActiveFilter ? (
                            <TouchableOpacity
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={() => {
                                    setActiveCategory(null);
                                    setSearch('');
                                    setDebouncedSearch('');
                                }}
                            >
                                <View style={styles.backBtnWrap}>
                                    <Feather name="chevron-left" size={22} color={COLORS.ink} />
                                    <Text style={styles.backBtnText}>Back</Text>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={styles.avatarBtn}>
                                    {user?.avatar_url ? (
                                        <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={styles.avatarFallback}>
                                            <Text style={styles.avatarText}>
                                                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={{ justifyContent: 'center' }}>
                                    <Text style={styles.greetingText}>
                                        Hey, {user?.name?.split(' ')[0] || 'Cook'} 👋
                                    </Text>
                                    <Text style={styles.greetingSubText}>
                                        {getGreeting()}
                                    </Text>
                                </View>
                            </View>
                        )}
                        {!hasActiveFilter && (
                            <TouchableOpacity
                                style={styles.notificationBtn}
                                onPress={() => setNotificationsVisible(true)}
                            >
                                <Ionicons name="notifications" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        )}
                    </View>
                );

            case 'search':
                return (
                    <View style={styles.searchBox}>
                        <Feather name="search" size={16} color={COLORS.muted} />
                        <TextInput
                            style={styles.searchInput}
                            value={search}
                            onChangeText={handleSearch}
                            placeholder="Search recipes or categories..."
                            placeholderTextColor={COLORS.placeholder}
                            returnKeyType="search"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
                                <Ionicons name="close-circle" size={16} color={COLORS.muted} />
                            </TouchableOpacity>
                        )}
                    </View>
                );

            case 'categories':
                return (
                    <>
                        <View style={styles.secHeaderRow}>
                            <Text style={styles.secTitle}>Categories</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                {activeCategory && (
                                    <TouchableOpacity
                                        style={styles.clearFilterBtn}
                                        onPress={() => setActiveCategory(null)}
                                    >
                                        <Feather name="x" size={14} color={COLORS.muted} />
                                        <Text style={styles.clearFilterText}>Clear</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <CategoryGrid
                            recipes={allRecipes}
                            activeCategory={activeCategory}
                            onSelect={setActiveCategory}
                        />
                    </>
                );

            case 'ingredientFinder':
                return (
                    <View style={styles.finderCard}>
                        <Text style={styles.finderTitle}>Cook With What You Have</Text>
                        <Text style={styles.finderSubtitle}>Enter ingredients and discover recipes instantly</Text>

                        <View style={{ position: 'relative', zIndex: 1000 }}>
                            <View style={styles.finderSearchRow} ref={searchRowRef}>
                                <Feather name="package" size={16} color={COLORS.muted} />
                                <TextInput
                                    style={styles.finderPlaceholderText}
                                    placeholder="Chicken, eggs, tomatoes..."
                                    placeholderTextColor={COLORS.placeholder}
                                    value={currentInput}
                                    onChangeText={(text) => {
                                        handleFinderInputChange(text);
                                        if (text.length > 0 && suggestions.length > 0) {
                                            updateOverlayPos();
                                        }
                                    }}
                                    onFocus={() => {
                                        if (currentInput.length > 0 && suggestions.length > 0) {
                                            setSuggestionsVisible(true);
                                            updateOverlayPos();
                                        }
                                    }}
                                    onSubmitEditing={() => addIngredient(currentInput)}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.finderSearchBtn,
                                        (confirmedIngredients.length === 0 && warningIngredients.length === 0 && !currentInput.trim()) && { opacity: 0.5, backgroundColor: COLORS.muted }
                                    ]}
                                    onPress={() => {
                                        const baseIngs = [...confirmedIngredients, ...warningIngredients];
                                        let finalIngs = [...baseIngs];
                                        const lastWord = currentInput.split(',').pop()?.trim();
                                        if (lastWord) {
                                            const { isValid, suggestion } = validateIngredient(lastWord, ALL_VALID_INGREDIENTS);
                                            finalIngs.push(isValid ? (suggestion || lastWord) : lastWord);
                                        }
                                        if (finalIngs.length > 0) {
                                            navigation.navigate('IngredientResults', { ingredients: finalIngs.map(i => i.toLowerCase()) });
                                        }
                                        setFeedbackMessage(null);
                                        setCurrentInput('');
                                    }}
                                    disabled={confirmedIngredients.length === 0 && warningIngredients.length === 0 && !currentInput.trim()}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.finderSearchBtnText}>Search</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );

            case 'featured':
                return <FeaturedCard recipe={item.recipe} onPress={onPressRecipe} />;

            case 'trendingHeader':
                return (
                    <View style={styles.secHeaderRow}>
                        <View>
                            <Text style={styles.secTitle}>Trending Recipes</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.viewAllBtn}
                            onPress={() => setShowAllTrending(v => !v)}
                        >
                            <Text style={styles.viewAllText}>
                                {showAllTrending ? 'Show Less' : 'View All'}
                            </Text>
                            <Feather name="chevron-right" size={14} color={COLORS.muted} />
                        </TouchableOpacity>
                    </View>
                );

            case 'recipeCard':
            case 'filteredRecipe':
                return (
                    <RecipeCard
                        recipe={item.recipe}
                        onPress={onPressRecipe}
                        onToggleSave={handleToggleSave}
                    />
                );

            case 'emptyFiltered':
                return (
                    <View style={styles.emptyPanel}>
                        <Feather name="search" size={28} color={COLORS.border} style={{ marginBottom: 10 }} />
                        <Text style={styles.emptyTitle}>No recipes match</Text>
                        <Text style={styles.emptyText}>Try a different keyword or category.</Text>
                    </View>
                );

            default:
                return null;
        }
    }, [
        activeCategory, allRecipes, handleSearch, handleToggleSave,
        navigation, onPressRecipe, savedRecipes, search, showAllTrending, user,
        confirmedIngredients, warningIngredients, feedbackMessage, currentInput,
        addIngredient, handleFinderInputChange, handleSuggestionClick,
        hasActiveFilter, filteredRecipes, suggestionsVisible, suggestions,
        updateOverlayPos,
    ]);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <FlatList
                data={listData}
                keyExtractor={(item, idx) => `${item.type}-${item.recipe?.id || idx}`}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                onScroll={() => setSuggestionsVisible(false)}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={feedQuery.refreshing || savedQuery.refreshing}
                        onRefresh={async () => {
                            await Promise.all([feedQuery.refresh(), savedQuery.refresh()]);
                        }}
                        tintColor={COLORS.green}
                    />
                }
            />
            <AppMenuSheet
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                navigation={navigation}
            />
            <ProfileMenu
                visible={profileMenuVisible}
                onClose={() => setProfileMenuVisible(false)}
                navigation={navigation}
                user={user}
            />
            <NotificationCenter
                visible={notificationsVisible}
                onClose={() => setNotificationsVisible(false)}
            />

            {suggestionsVisible && currentInput.length > 0 && suggestions.length > 0 && (
                <>
                    <View
                        style={styles.rootBackdrop}
                        pointerEvents="box-none"
                    />
                    <View style={[styles.suggestionsOverlay, {
                        top: overlayPos.top,
                        left: overlayPos.left,
                        width: overlayPos.width
                    }]}>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {suggestions.map((suggestion, idx) => (
                                <TouchableOpacity
                                    key={`sugg-${idx}`}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSuggestionClick(suggestion)}
                                >
                                    <Text style={styles.suggestionText}>{suggestion}</Text>
                                    <Feather name="check" size={12} color={COLORS.green} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </>
            )}

            <Modal
                visible={showAllInvalidModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAllInvalidModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.invalidModalContent}>
                        <View style={styles.invalidModalHeader}>
                            <Ionicons name="alert-circle-outline" size={48} color={COLORS.orange} />
                            <Text style={styles.invalidModalTitle}>No matching ingredients found</Text>
                            <Text style={styles.invalidModalSubtitle}>Try using our suggestions or browse categories below.</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.invalidModalBtnPrimary}
                            onPress={() => {
                                setCurrentInput('chicken, tomato, onion, ');
                                setShowAllInvalidModal(false);
                            }}
                        >
                            <Text style={styles.invalidModalBtnPrimaryText}>Try Popular Ingredients</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.invalidModalBtnSecondary}
                            onPress={() => setShowAllInvalidModal(false)}
                        >
                            <Text style={styles.invalidModalBtnSecondaryText}>Browse Categories</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe:    { flex: 1, backgroundColor: COLORS.cream },
    content: { paddingHorizontal: 12, paddingBottom: 110 },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 4,
        paddingBottom: 14,
    },
    brand:     { fontFamily: FONTS.sansBold, fontSize: 18, color: COLORS.green, letterSpacing: -0.5 },
    avatarBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.orange },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1DCCF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    clearFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.card,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    clearFilterText: {
        fontFamily: FONTS.sansMed,
        fontSize: 10,
        color: COLORS.muted,
    },
    backBtnWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    backBtnText: {
        fontFamily: FONTS.sansMed,
        fontSize: 13,
        color: COLORS.ink,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        marginBottom: 14,
        ...SHADOWS.sm,
    },
    searchInput: { flex: 1, fontFamily: FONTS.sans, fontSize: 13, color: COLORS.ink },

    secHeader:    { marginBottom: 10 },
    secHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 10,
    },
    secTitle: { fontFamily: FONTS.sansBold, fontSize: 16, color: '#4A463F' },

    viewAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewAllText: { fontFamily: FONTS.sansMed, fontSize: 10, color: COLORS.muted },

    bentoGrid: {
        // Removed in favor of categoryScroll
    },
    categoryScroll: {
        paddingVertical: 12,
        gap: 16,
    },
    catItem: {
        alignItems: 'center',
        width: 85,
        gap: 8,
    },
    catItemActive: {
        // Active state handled by label color
    },
    catIconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: '#F0EBE3',
    },
    catLabel: {
        fontFamily: FONTS.sansMed,
        fontSize: 12,
        color: COLORS.muted,
        textAlign: 'center',
    },
    catLabelActive: {
        color: COLORS.ink,
        fontFamily: FONTS.sansBold,
    },
    bentoTile: {
        borderRadius: 28,
        overflow: 'hidden',
        ...SHADOWS.sm,
    },
    bentoHero: {
        width: '100%',
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bentoSupport: {
        width: '48%',
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glassContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 50,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    glassContainerSmall: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    bentoLabel: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
    },
    bentoLabelHero: {
        fontSize: 18,
    },
    bentoActive: {
        borderWidth: 3,
        borderColor: COLORS.green,
    },


    featuredCard: {
        height: 280,
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 24,
        backgroundColor: '#1A1A1A',
        ...SHADOWS.lg,
    },
    featuredImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    featuredBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
    },
    badgeInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.gold,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    featuredBadgeText: {
        fontFamily: FONTS.sansBold,
        fontSize: 10,
        color: COLORS.ink,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    featuredContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 32,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    featuredTitle: {
        fontFamily: FONTS.serifBold,
        fontSize: 32,
        lineHeight: 38,
        color: COLORS.white,
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    featuredHook: {
        fontFamily: FONTS.sans,
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 22,
        marginBottom: 20,
    },
    featuredMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metricText: {
        fontFamily: FONTS.sansMed,
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
    },
    metricSeparator: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },

    recipeCard: {
        marginBottom: 14, borderRadius: 16, overflow: 'hidden',
        backgroundColor: COLORS.card,
        borderWidth: 1, borderColor: '#EFE8DE', ...SHADOWS.sm,
    },
    recipeImage: { width: '100%', height: 178 },
    bookmarkBtn: {
        position: 'absolute', top: 12, right: 12,
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(0,0,0,0.36)',
        alignItems: 'center', justifyContent: 'center',
    },
    bookmarkBtnActive: { backgroundColor: COLORS.green },
    recipeBody:  { padding: 12 },
    recipeTitle: { fontFamily: FONTS.serifMed, fontSize: 14, color: '#40392F', marginBottom: 4 },
    recipeDesc:  { fontFamily: FONTS.sans, fontSize: 10, lineHeight: 14, color: '#918B83', marginBottom: 8 },
    recipeFooter:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText:  { fontFamily: FONTS.sansMed, fontSize: 10, color: COLORS.muted },

    emptyPanel: {
        borderRadius: 14, borderWidth: 1, borderColor: '#EEE6DB',
        backgroundColor: COLORS.card,
        paddingHorizontal: 16, paddingVertical: 22,
        marginBottom: 12, alignItems: 'center',
    },
    emptyTitle: { fontFamily: FONTS.sansBold, fontSize: 12, color: '#4C473F' },
    emptyText:  {
        marginTop: 4, fontFamily: FONTS.sans, fontSize: 10,
        lineHeight: 14, color: '#8F897F', textAlign: 'center',
    },

    mealPrepStrip: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    finderCard: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 16,
        marginTop: 14,
        marginBottom: 20,
        ...SHADOWS.sm,
    },
    finderTitle: {
        fontFamily: FONTS.sansBold,
        fontSize: 16,
        color: COLORS.ink,
    },
    finderSubtitle: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        color: COLORS.muted,
        marginBottom: 16,
    },
    finderSearchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    finderPlaceholderText: {
        flex: 1,
        fontFamily: FONTS.sans,
        fontSize: 13,
        color: COLORS.ink,
    },
    finderSearchBtn: {
        backgroundColor: COLORS.green,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    finderSearchBtnText: {
        fontFamily: FONTS.sansBold,
        fontSize: 11,
        color: COLORS.white,
    },
    ingredientTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.green,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 50,
        marginRight: 6,
        marginBottom: 6,
    },
    ingredientTagText: {
        fontFamily: FONTS.sansMed,
        fontSize: 11,
        color: COLORS.white,
    },
    ingredientTagWarning: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.warning,
        borderWidth: 1,
    },
    ingredientTagWarningText: {
        color: COLORS.warning,
    },
    ingredientFeedback: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        color: COLORS.muted,
        marginBottom: 8,
        textAlign: 'center',
    },
    feedbackHighlight: {
        fontFamily: FONTS.sansBold,
        color: COLORS.orange,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    invalidModalContent: {
        width: '85%',
        backgroundColor: COLORS.card,
        borderRadius: 24,
        padding: 24,
        ...SHADOWS.lg,
        alignItems: 'center',
    },
    invalidModalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    invalidModalTitle: {
        fontFamily: FONTS.sansBold,
        fontSize: 18,
        color: COLORS.ink,
        marginTop: 12,
        textAlign: 'center',
    },
    invalidModalSubtitle: {
        fontFamily: FONTS.sans,
        fontSize: 13,
        color: COLORS.muted,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 18,
    },
    invalidModalBtnPrimary: {
        backgroundColor: COLORS.green,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    invalidModalBtnPrimaryText: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
        color: COLORS.white,
    },
    invalidModalBtnSecondary: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: 'transparent',
    },
    invalidModalBtnSecondaryText: {
        fontFamily: FONTS.sansMed,
        fontSize: 14,
        color: COLORS.muted,
    },
    rootBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        zIndex: 999,
        pointerEvents: 'box-none',
    },
    suggestionsOverlay: {
        position: 'absolute',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 4,
        zIndex: 1000,
        maxHeight: 200,
        ...SHADOWS.md,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: '#F5F5F5',
    },
    suggestionText: {
        fontFamily: FONTS.sansMed,
        fontSize: 13,
        color: COLORS.ink,
        flex: 1,
        marginRight: 8,
    },
    greetingText: {
        fontFamily: FONTS.sansBold,
        fontSize: 18,
        color: COLORS.ink,
        marginLeft: 12
    },
    greetingSubText: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        color: COLORS.muted,
        marginLeft: 12
    },
    notificationBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF8C00',
        alignItems: 'center',
        justifyContent: 'center',
    },
});