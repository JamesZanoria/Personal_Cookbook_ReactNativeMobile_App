import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ImageBackground, Image, RefreshControl, TextInput, Modal, ActivityIndicator, Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRecipes } from '../hooks/useRecipes';
import { collectionAPI } from '../api/collections';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { formatTime } from '../utils/format';
import { showToast } from '../components/Toast';
import AppMenuSheet, { ProfileMenu } from '../components/AppMenuSheet';

const TABS = ['All', 'Saved', 'Mine'];
const FALLBACK = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80';

function CreateCollectionModal({ visible, onClose, onCreate }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [nameError, setNameError] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            setNameError(true);
            showToast('Enter a collection name', 'error');
            return;
        }

        try {
            setSaving(true);
            await onCreate(name.trim(), description.trim());
            setName('');
            setDescription('');
            setNameError(false);
            onClose();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={m.sheet} activeOpacity={1} onPress={() => {}}>
                    <View style={m.handle} />
                    <Text style={m.title}>New Collection</Text>
                    <Text style={m.label}>NAME</Text>
                    <TextInput
                        style={[m.input, nameError && m.inputError]}
                        value={name}
                        onChangeText={val => {
                            setName(val);
                            if (val.trim()) setNameError(false);
                        }}
                        placeholder="e.g. Holiday Favorites"
                        placeholderTextColor={COLORS.placeholder}
                        autoFocus
                    />
                    {nameError && <Text style={m.errorText}>This field is required</Text>}
                    <Text style={[m.label, { marginTop: 8 }]}>DESCRIPTION (optional)</Text>
                    <TextInput
                        style={[m.input, m.textarea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What's this collection about?"
                        placeholderTextColor={COLORS.placeholder}
                        multiline
                        textAlignVertical="top"
                    />
                    <View style={m.actions}>
                        <TouchableOpacity style={m.btnCancel} onPress={onClose}>
                            <Text style={m.btnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[m.btnCreate, saving && { opacity: 0.6 }]}
                            onPress={handleCreate}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color={COLORS.white} size="small" />
                                : <Text style={m.btnCreateText}>Create</Text>}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

function CollectionPickerModal({ visible, onClose, collections, onSelect, selectedRecipe }) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={m.sheet} activeOpacity={1} onPress={() => {}}>
                    <View style={m.handle} />
                    <Text style={m.title}>Add to Collection</Text>
                    <Text style={pickerStyles.subtitle} numberOfLines={2}>
                        {selectedRecipe?.title || 'Select a collection'}
                    </Text>

                    {collections.length ? collections.map((collection) => {
                        const isAlreadyAdded = collection.recipes?.some(r => r.id === selectedRecipe?.id);
                        return (
                            <TouchableOpacity
                                key={collection.id}
                                style={[pickerStyles.item, isAlreadyAdded && { backgroundColor: COLORS.greenLight, borderColor: COLORS.green }]}
                                onPress={() => !isAlreadyAdded && onSelect(collection)}
                                activeOpacity={0.88}
                                disabled={isAlreadyAdded}
                            >
                                <Feather name="folder" size={16} color={COLORS.green} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[pickerStyles.itemTitle, isAlreadyAdded && { color: COLORS.green }]}>{collection.name}</Text>
                                    <Text style={pickerStyles.itemSub}>{collection.recipe_count || 0} recipes</Text>
                                </View>
                                {isAlreadyAdded ? (
                                    <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
                                ) : (
                                    <Feather name="plus" size={16} color={COLORS.muted} />
                                )}
                            </TouchableOpacity>
                        );
                    }) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyCardTitle}>Create a collection first</Text>
                            <Text style={styles.emptyCardText}>Collections appear here once you make one.</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

function CollectionDetailModal({ visible, onClose, collection, loading, onOpenRecipe }) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={m.sheet} activeOpacity={1} onPress={() => {}}>
                    <View style={m.handle} />
                    <Text style={m.title}>{collection?.name || 'Collection'}</Text>
                    {collection?.description ? <Text style={pickerStyles.subtitle}>{collection.description}</Text> : null}

                    {loading ? (
                        <ActivityIndicator color={COLORS.green} style={{ marginVertical: 24 }} />
                    ) : collection?.recipes?.length ? (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {collection.recipes.map((recipe) => (
                                <TouchableOpacity
                                    key={recipe.id}
                                    style={pickerStyles.recipeItem}
                                    onPress={() => onOpenRecipe(recipe)}
                                    activeOpacity={0.9}
                                >
                                    <Image source={{ uri: recipe.photo_url || FALLBACK }} style={pickerStyles.recipeThumb} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={pickerStyles.itemTitle} numberOfLines={1}>{recipe.title}</Text>
                                        <Text style={pickerStyles.itemSub} numberOfLines={2}>
                                            {recipe.story || `By ${recipe.author_name || 'Anonymous'}`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyCardTitle}>No recipes in this collection yet</Text>
                            <Text style={styles.emptyCardText}>Use the folder-plus button on a recipe to add one here.</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

export default function CookbookScreen({ navigation, route }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'All');
    const [collections, setCollections] = useState([]);
    const [colsLoading, setColsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [activeCollection, setActiveCollection] = useState(null);
    const [collectionLoading, setCollectionLoading] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [profileMenuVisible, setProfileMenuVisible] = useState(false);
    const [viewMode, setViewMode] = useState('list');

    const loadCollections = useCallback(async () => {
        try {
            setColsLoading(true);
            const data = await collectionAPI.getAll();
            setCollections(Array.isArray(data) ? data : []);
        } catch (error) {
            setCollections([]);
            showToast(error.message, 'error');
        } finally {
            setColsLoading(false);
        }
    }, []);

    const allQuery = useRecipes('feed');
    const savedQuery = useRecipes('saved');
    const mineQuery = useRecipes('mine');

    const refreshRefs = useRef({
        all: allQuery.refresh,
        saved: savedQuery.refresh,
        mine: mineQuery.refresh,
    });

    useEffect(() => {
        refreshRefs.current = {
            all: allQuery.refresh,
            saved: savedQuery.refresh,
            mine: mineQuery.refresh,
        };
    }, [allQuery, savedQuery, mineQuery]);

    useFocusEffect(
        useCallback(() => {
            refreshRefs.current.all();
            refreshRefs.current.saved();
            refreshRefs.current.mine();
            loadCollections();
        }, [loadCollections])
    );

    useEffect(() => {
        loadCollections();
    }, [loadCollections]);

    useEffect(() => {
        if (route.params?.initialTab) setActiveTab(route.params.initialTab);
    }, [route.params?.initialTab]);

    const visibleRecipes = useMemo(() => {
        if (activeTab === 'Mine') return mineQuery.recipes;
        if (activeTab === 'Saved') return savedQuery.recipes;
        return allQuery.recipes;
    }, [activeTab, allQuery.recipes, mineQuery.recipes, savedQuery.recipes]);

    const onRefresh = async () => {
        await Promise.all([
            allQuery.refresh(),
            savedQuery.refresh(),
            mineQuery.refresh(),
            loadCollections(),
        ]);
    };

    const handleCreateCollection = async (name, description) => {
        try {
            const payload = {
                name,
                description,
                user_id: user?.id,
            };
            const result = await collectionAPI.create(payload);

            // Supabase .select() returns an array of inserted rows
            const newCollection = Array.isArray(result) ? result[0] : result;

            if (newCollection) {
                setCollections((prev) => [newCollection, ...prev]);
                showToast('Collection created!');
            }

            // Refresh to sync server-side counts and state
            await loadCollections();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleDeleteCollection = (collection) => {
        Alert.alert(
            'Delete Collection',
            `Delete "${collection.name}"? Recipes inside will not be deleted.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await collectionAPI.remove(collection.id);
                            setCollections((prev) => prev.filter((item) => item.id !== collection.id));
                            showToast('Collection deleted');
                        } catch (error) {
                            showToast(error.message, 'error');
                        }
                    },
                },
            ]
        );
    };

    const handleOpenCollection = async (collection) => {
        try {
            setCollectionLoading(true);
            setShowCollectionModal(true);
            const detail = await collectionAPI.getOne(collection.id);
            setActiveCollection(detail);
        } catch (error) {
            showToast(error.message, 'error');
            setShowCollectionModal(false);
        } finally {
            setCollectionLoading(false);
        }
    };

    const handlePickCollection = async (collection) => {
        if (!selectedRecipe) return;
        try {
            // Optimistically update collection count
            setCollections((prev) =>
                prev.map(col =>
                    col.id === collection.id
                        ? { ...col, recipe_count: (col.recipe_count || 0) + 1 }
                        : col
                )
            );

            await collectionAPI.addRecipe(collection.id, selectedRecipe.id);
            setShowPickerModal(false);
            setSelectedRecipe(null);

            // Refresh collections to get accurate server-side counts and synced recipe lists
            await loadCollections();
            showToast(`Added to ${collection.name}`);
        } catch (error) {
            // Revert on error
            await loadCollections();
            showToast(error.message, 'error');
        }
    };

    const openCollectionPicker = (recipe) => {
        setSelectedRecipe(recipe);
        setShowPickerModal(true);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={allQuery.refreshing || savedQuery.refreshing || mineQuery.refreshing || colsLoading}
                        onRefresh={onRefresh}
                        tintColor={COLORS.green}
                    />
                }
            >
                <View style={styles.topBar}>
                    <View style={{ width: 22 }} />
                    <Text style={styles.brand}>Digital Atelier</Text>
                    <View style={{ width: 22 }} />
                </View>

                <Text style={styles.eyebrow}>YOUR LIBRARY</Text>
                <Text style={styles.title}>Personal{'\n'}Cookbook</Text>
                <Text style={styles.summary}>
                    {visibleRecipes.length} {visibleRecipes.length === 1 ? 'recipe' : 'recipes'} in this view
                </Text>

                <View style={styles.tabRow}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                            activeOpacity={0.9}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.secHeader}>
                    <Text style={styles.secTitle}>Collections</Text>
                </View>

                {colsLoading ? (
                    <ActivityIndicator color={COLORS.green} style={{ marginVertical: 20 }} />
                ) : collections.length ? (
                    collections.map((collection) => (
                        <TouchableOpacity
                            key={collection.id}
                            style={styles.colCard}
                            activeOpacity={0.93}
                            onPress={() => handleOpenCollection(collection)}
                            onLongPress={() => handleDeleteCollection(collection)}
                        >
                            <ImageBackground source={{ uri: collection.cover_url || FALLBACK }} style={styles.colImage} imageStyle={{ borderRadius: 14 }}>
                                <View style={styles.colOverlay} />
                                <View style={styles.colBody}>
                                    <View style={styles.colMetaRow}>
                                        <Feather name="layers" size={11} color="rgba(255,255,255,0.75)" />
                                        <Text style={styles.colMeta}>{collection.recipe_count || 0} Recipes</Text>
                                    </View>
                                    <Text style={styles.colTitle}>{collection.name}</Text>
                                    {collection.description ? <Text style={styles.colDesc} numberOfLines={1}>{collection.description}</Text> : null}
                                </View>
                            </ImageBackground>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyCard}>
                        <Feather name="folder" size={24} color={COLORS.border} style={{ marginBottom: 8 }} />
                        <Text style={styles.emptyCardTitle}>No collections yet</Text>
                        <Text style={styles.emptyCardText}>Tap "Create New" to make your first collection.</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.createFolderCard} onPress={() => setShowCreateModal(true)} activeOpacity={0.88}>
                    <Feather name="folder-plus" size={20} color={COLORS.muted} />
                    <Text style={styles.createFolderText}>Create New Folder</Text>
                </TouchableOpacity>

                <View style={styles.secHeader}>
                    <Text style={styles.secTitle}>
                        {activeTab === 'Mine' ? 'My Creations' : activeTab === 'Saved' ? 'Saved Recipes' : 'Recent Recipes'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
                        style={styles.viewToggle}
                    >
                        <Feather name={viewMode === 'list' ? 'grid' : 'list'} size={16} color={COLORS.green} />
                    </TouchableOpacity>
                </View>

                {/* Saved uses the dedicated saved endpoint so Discover/Detail bookmarks always show up here after refresh. */}
                <View style={[styles.recipeContainer, viewMode === 'grid' && styles.recipeContainerGrid]}>
                    {visibleRecipes.length ? (
                        visibleRecipes.map((recipe) => (
                            <TouchableOpacity
                                key={recipe.id}
                                style={[styles.recipeCard, viewMode === 'grid' && styles.recipeCardGrid]}
                                onPress={() => navigation.navigate('Detail', { recipeId: recipe.id })}
                                activeOpacity={0.95}
                            >
                                <Image source={{ uri: recipe.photo_url || FALLBACK }} style={[styles.recipeImage, viewMode === 'grid' && styles.recipeImageGrid]} />
                                <View style={[styles.recipeBody, viewMode === 'grid' && styles.recipeBodyGrid]}>
                                    <View style={styles.recipeTop}>
                                        <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
                                        {recipe.is_saved ? <Ionicons name="bookmark" size={14} color={COLORS.green} /> : null}
                                    </View>
                                    <Text style={styles.recipeStory} numberOfLines={viewMode === 'grid' ? 1 : 2}>
                                        {recipe.story || `By ${recipe.author_name || 'Anonymous'}`}
                                    </Text>
                                    <View style={[styles.recipeMeta, viewMode === 'grid' && styles.recipeMetaGrid]}>
                                        <View style={styles.metaItem}>
                                            <Feather name="clock" size={11} color={COLORS.muted} />
                                            <Text style={styles.metaText}>{formatTime(recipe.cook_time) || '-'}</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="heart" size={11} color={COLORS.orange} />
                                            <Text style={styles.metaText}>{recipe.like_count || 0}</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="star" size={11} color={COLORS.gold} />
                                            <Text style={styles.metaText}>{recipe.avg_rating || 0}</Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[styles.addToCollectionBtn, viewMode === 'grid' && styles.addToCollectionBtnGrid]}
                                    onPress={() => openCollectionPicker(recipe)}
                                >
                                    <Feather name="folder-plus" size={16} color={COLORS.green} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Feather
                                name={activeTab === 'Mine' ? 'edit' : activeTab === 'Saved' ? 'bookmark' : 'book-open'}
                                size={28}
                                color={COLORS.border}
                                style={{ marginBottom: 10 }}
                            />
                            <Text style={styles.emptyCardTitle}>
                                {activeTab === 'Mine' ? "You haven't created any recipes yet" : activeTab === 'Saved' ? 'No saved recipes yet' : 'No recipes found'}
                            </Text>
                            <Text style={styles.emptyCardText}>
                                {activeTab === 'Mine' ? 'Tap the + button to create your first recipe.' : 'Browse Discover and save recipes to see them here.'}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <CreateCollectionModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateCollection} />
            <CollectionPickerModal
                visible={showPickerModal}
                onClose={() => { setShowPickerModal(false); setSelectedRecipe(null); }}
                collections={collections}
                onSelect={handlePickCollection}
                selectedRecipe={selectedRecipe}
            />
            <CollectionDetailModal
                visible={showCollectionModal}
                onClose={() => { setShowCollectionModal(false); setActiveCollection(null); }}
                collection={activeCollection}
                loading={collectionLoading}
                onOpenRecipe={(recipe) => {
                    setShowCollectionModal(false);
                    navigation.navigate('Detail', { recipeId: recipe.id });
                }}
            />
            <AppMenuSheet visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />
            <ProfileMenu
                visible={profileMenuVisible}
                onClose={() => setProfileMenuVisible(false)}
                navigation={navigation}
                user={user}
            />
        </SafeAreaView>
    );
}

const m = StyleSheet.create({
    overlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'flex-end' 
    },
    sheet: { 
        backgroundColor: COLORS.cream, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        padding: 24, 
        paddingBottom: 40, 
        maxHeight: '80%' 
    },
    handle: { 
        width: 40, 
        height: 4, 
        backgroundColor: COLORS.border, 
        borderRadius: 2, 
        alignSelf: 'center', 
        marginBottom: 20 
    },
    title: { 
        fontFamily: FONTS.serif, 
        fontSize: 22, 
        color: COLORS.ink, 
        marginBottom: 12 
    },
    label: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 9, 
        color: COLORS.muted, 
        letterSpacing: 0.8, 
        textTransform: 'uppercase', 
        marginBottom: 6 
    },
    input: {
        backgroundColor: COLORS.card,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: FONTS.sans,
        fontSize: 14,
        color: COLORS.ink,
        marginBottom: 16
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    errorText: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        color: COLORS.danger,
        marginBottom: 12,
        marginTop: -12, 
    },
    textarea: {
        minHeight: 80,
        textAlignVertical: 'top'
    },
    actions: { 
        flexDirection: 'row', 
        gap: 10, 
        marginTop: 8 
    },
    btnCancel: { 
        flex: 1, 
        paddingVertical: 14, 
        borderRadius: 50, 
        borderWidth: 1.5, 
        borderColor: COLORS.border, 
        alignItems: 'center' 
    },
    btnCancelText: { 
        fontFamily: FONTS.sansMed, 
        fontSize: 14, 
        color: COLORS.ink 
    },
    btnCreate: { 
        flex: 1, 
        paddingVertical: 14, 
        borderRadius: 50, 
        backgroundColor: COLORS.green, 
        alignItems: 'center' 
    },
    btnCreateText: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 14, 
        color: COLORS.white 
    },
});

const pickerStyles = StyleSheet.create({
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        lineHeight: 18,
        color: COLORS.muted,
        marginBottom: 14,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 10,
    },
    itemTitle: {
        fontFamily: FONTS.sansBold,
        fontSize: 13,
        color: COLORS.ink,
    },
    itemSub: {
        marginTop: 2,
        fontFamily: FONTS.sans,
        fontSize: 10,
        lineHeight: 14,
        color: COLORS.muted,
    },
    recipeItem: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 10,
        marginBottom: 10,
    },
    recipeThumb: {
        width: 58,
        height: 58,
        borderRadius: 10,
    },
});

const styles = StyleSheet.create({
    safe: { 
        flex: 1, 
        backgroundColor: '#FCFAF6' 
    },
    content: { 
        paddingHorizontal: 12, 
        paddingBottom: 110 
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 4,
        paddingBottom: 14,
    },
    brand: {
        fontFamily: FONTS.sansBold,
        fontSize: 18,
        color: COLORS.green,
        letterSpacing: -0.5
    },
    avatarBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarText: {
        fontFamily: FONTS.sansBold,
        fontSize: 12,
        color: COLORS.orange
    },
    avatarImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarFallback: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1DCCF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    eyebrow: {
        marginTop: 4, 
        fontFamily: FONTS.sansBold, 
        fontSize: 9, 
        letterSpacing: 1.1, 
        color: '#A4A091' 
    },
    title: { 
        marginTop: 6, 
        fontFamily: FONTS.serif, 
        fontSize: 38, 
        lineHeight: 40, 
        color: '#2C281F' 
    },
    summary: { 
        marginTop: 8, 
        fontFamily: FONTS.sans, 
        fontSize: 11, 
        color: '#8F897F', 
        marginBottom: 18 
    },
    tabRow: { 
        flexDirection: 'row', 
        backgroundColor: '#F0ECE4', 
        borderRadius: 999, 
        padding: 4, 
        marginBottom: 18, 
        alignSelf: 'flex-start' 
    },
    tab: { 
        paddingHorizontal: 18, 
        paddingVertical: 8, 
        borderRadius: 999 
    },
    tabActive: { 
        backgroundColor: COLORS.green 
    },
    tabText: { 
        fontFamily: FONTS.sansMed, 
        fontSize: 11, 
        color: '#8C867A' 
    },
    tabTextActive: { 
        color: COLORS.white 
    },
    secHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 10 
    },
    secTitle: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 12, 
        color: '#4C473F' 
    },
    secAction: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 5 
    },
    secActionText: { 
        fontFamily: FONTS.sansMed, 
        fontSize: 10, 
        color: COLORS.green 
    },
    colCard: { 
        height: 118, 
        borderRadius: 14, 
        overflow: 'hidden', 
        marginBottom: 10, 
        ...SHADOWS.sm 
    },
    colImage: { 
        flex: 1, 
        justifyContent: 'flex-end' 
    },
    colOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(27,22,18,0.38)', 
        borderRadius: 14 
    },
    colBody: { 
        padding: 14 
    },
    colMetaRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 5, 
        marginBottom: 3 
    },
    colMeta: { 
        fontFamily: FONTS.sans, 
        fontSize: 10, 
        color: 'rgba(255,255,255,0.78)' 
    },
    colTitle: { 
        fontFamily: FONTS.serif, 
        fontSize: 22, 
        lineHeight: 23, 
        color: COLORS.white 
    },
    colDesc: { 
        fontFamily: FONTS.sans, 
        fontSize: 10, 
        color: 'rgba(255,255,255,0.7)', marginTop: 2 
    },
    createFolderCard: { 
        height: 72, 
        borderRadius: 14, 
        borderWidth: 1, 
        borderStyle: 'dashed', 
        borderColor: '#EEE6DB', 
        backgroundColor: COLORS.card, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        marginBottom: 18 
    },
    createFolderText: { 
        fontFamily: FONTS.sansMed, 
        fontSize: 11, 
        color: COLORS.muted 
    },
    recipeCard: { 
        flexDirection: 'row', 
        marginBottom: 10, 
        borderRadius: 14, 
        overflow: 'hidden', 
        backgroundColor: COLORS.card, 
        borderWidth: 1, 
        borderColor: '#EEE6DB', 
        ...SHADOWS.sm 
    },
    recipeImage: { 
        width: 86, 
        height: 86 
    },
    recipeBody: { 
        flex: 1, 
        padding: 10, 
        justifyContent: 'center' 
    },
    recipeTop: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 4 
    },
    recipeTitle: { 
        fontFamily: FONTS.serifMed, 
        fontSize: 13, 
        color: '#40392F', 
        flex: 1, 
        marginRight: 6 
    },
    recipeStory: { 
        fontFamily: FONTS.sans, 
        fontSize: 10, 
        lineHeight: 14, 
        color: '#918B83', 
        marginBottom: 6 
    },
    recipeMeta: { 
        flexDirection: 'row', 
        gap: 12, 
        flexWrap: 'wrap' 
    },
    metaItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4 
    },
    metaText: { 
        fontFamily: FONTS.sansMed, 
        fontSize: 10, 
        color: COLORS.muted 
    },
    addToCollectionBtn: { 
        justifyContent: 'center', 
        alignItems: 'center', 
        width: 44 
    },
    emptyCard: { 
        borderRadius: 14, 
        borderWidth: 1, 
        borderColor: '#EEE6DB', 
        backgroundColor: COLORS.card, 
        paddingHorizontal: 14, 
        paddingVertical: 20, 
        marginBottom: 12, 
        alignItems: 'center' 
    },
    emptyCardTitle: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 12, 
        color: '#4C473F' 
    },
    emptyCardText: {
        marginTop: 4,
        fontFamily: FONTS.sans,
        fontSize: 10,
        lineHeight: 14,
        color: '#8F897F',
        textAlign: 'center'
    },
    viewToggle: {
        padding: 6,
        backgroundColor: COLORS.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EEE6DB',
    },
    recipeContainer: {
        flexDirection: 'column',
    },
    recipeContainerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    recipeCardGrid: {
        width: '48%',
        flexDirection: 'column',
        marginBottom: 12,
    },
    recipeImageGrid: {
        width: '100%',
        height: 120,
    },
    recipeBodyGrid: {
        padding: 8,
        justifyContent: 'flex-start',
    },
    recipeMetaGrid: {
        gap: 8,
    },
    addToCollectionBtnGrid: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 4,
        ...SHADOWS.sm,
    },
});