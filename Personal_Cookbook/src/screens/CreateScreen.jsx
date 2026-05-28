import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator, Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { recipesAPI } from '../api/recipes';
import { useUpload } from '../hooks/useUpload';
import { showToast } from '../components/Toast';
import { validateRecipeForm } from '../utils/validate';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { CATEGORIES, DIFFICULTIES } from '../constants/categories';

const EMPTY_INGREDIENT = { qty: '', name: '' };
const EMPTY_STEP = { text: '', photo_url: '' };

const CAT_ICONS = {
    'Quick Meals': 'zap',
    'Vegetarian': 'feather',
    'Baking': 'coffee',
    'Trending': 'trending-up',
    'Breakfast': 'sun',
    'Lunch': 'cloud',
    'Dinner': 'moon',
    'Dessert': 'heart',
    'Seafood': 'droplet',
    'Pasta': 'layers',
};

function parseMaybeArray(value, fallback) {
    if (Array.isArray(value) && value.length) return value;
    if (typeof value === 'string') {
        try {
            const p = JSON.parse(value);
            if (Array.isArray(p) && p.length) return p;
        } catch {}
    }
    return [fallback];
}

export default function CreateScreen({ navigation, route }) {
    const { user } = useAuth();
    const editRecipe = route.params?.recipe || null;

    const initIngredients = useMemo(
        () => parseMaybeArray(editRecipe?.ingredients, EMPTY_INGREDIENT),
        [editRecipe]
    );
    const initSteps = useMemo(
        () => parseMaybeArray(editRecipe?.instructions, EMPTY_STEP),
        [editRecipe]
    );

    const [form, setForm] = useState({
        title: editRecipe?.title || '',
        story: editRecipe?.story || '',
        category: editRecipe?.category || 'Quick Meals',
        difficulty: editRecipe?.difficulty || 'Easy',
        prep_time: editRecipe?.prep_time ? String(editRecipe.prep_time) : '',
        cook_time: editRecipe?.cook_time ? String(editRecipe.cook_time) : '',
        servings: editRecipe?.servings ? String(editRecipe.servings) : '',
        photo_url: editRecipe?.photo_url || '',
        ingredients: initIngredients,
        instructions: initSteps,
    });

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const resetForm = useCallback(() => {
        setForm({
            title: '',
            story: '',
            category: 'Quick Meals',
            difficulty: 'Easy',
            prep_time: '',
            cook_time: '',
            servings: '',
            photo_url: '',
            ingredients: [EMPTY_INGREDIENT],
            instructions: [EMPTY_STEP],
        });
        setErrors({});
    }, []);

    // Separate upload hook instances for hero vs step photos
    const heroUpload = useUpload();
    const stepUpload = useUpload();

    const setField = useCallback((key, value) => {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
    }, [errors]);

    // ── Ingredients ────────────────────────────────────────────────────────────

    const updateIngredient = (i, key, val) => {
        const next = [...form.ingredients];
        next[i] = { ...next[i], [key]: val };
        setField('ingredients', next);
    };
    const addIngredient = () => setField('ingredients', [...form.ingredients, { ...EMPTY_INGREDIENT }]);
    const removeIngredient = (i) => {
        if (form.ingredients.length === 1) return;
        setField('ingredients', form.ingredients.filter((_, idx) => idx !== i));
    };

    // ── Steps ──────────────────────────────────────────────────────────────────

    const updateStep = (i, key, val) => {
        const next = [...form.instructions];
        next[i] = { ...next[i], [key]: val };
        setField('instructions', next);
    };
    const addStep = () => setField('instructions', [...form.instructions, { ...EMPTY_STEP }]);
    const removeStep = (i) => {
        if (form.instructions.length === 1) return;
        setField('instructions', form.instructions.filter((_, idx) => idx !== i));
    };

    // Upload a photo for a specific step
    const pickStepPhoto = async (stepIndex) => {
        const url = await stepUpload.pickAndUpload();
        if (url) updateStep(stepIndex, 'photo_url', url);
    };

    // ── Hero photo ─────────────────────────────────────────────────────────────
    // This calls pickAndUpload which opens the device photo library, uploads the
    // file to POST /api/uploads/image, and returns the hosted URL.
    // That URL is stored in form.photo_url and sent with the recipe payload.
    const pickHeroPhoto = async () => {
        const url = await heroUpload.pickAndUpload();
        if (url) setField('photo_url', url);
    };

    // ── Back / discard ─────────────────────────────────────────────────────────

    const handleBack = () => {
        const dirty =
            form.title.trim() ||
            form.ingredients.some(i => i.name.trim()) ||
            form.instructions.some(s => s.text.trim());
        if (dirty && !editRecipe) {
            Alert.alert('Discard Recipe?', 'You have unsaved changes.', [
                { text: 'Keep editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
            ]);
        } else {
            navigation.goBack();
        }
    };

    // ── Save ───────────────────────────────────────────────────────────────────

    const handleSave = async (publish = false) => {
        const validIngredients = form.ingredients.filter(i => i.name.trim());
        const validSteps = form.instructions.filter(s => s.text.trim());

        const errs = validateRecipeForm({
            title: form.title,
            ingredients: validIngredients,
            instructions: validSteps,
        });

        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        try {
            setSaving(true);
            const payload = {
                title: form.title,
                story: form.story || null,
                category: form.category || null,
                difficulty: form.difficulty || 'Easy',
                cook_time: Number(form.cook_time) || null,
                prep_time: Number(form.prep_time) || null,
                servings: Number(form.servings) || null,
                
                // photo_url holds the server-hosted URL returned by /api/uploads/image.
                // For edit mode it may be the existing URL unchanged.
                photo_url: form.photo_url || null,
                ingredients: validIngredients,
                instructions: validSteps,
                is_published: publish,
            };

            if (editRecipe?.id) {
                await recipesAPI.update(editRecipe.id, payload);
                showToast('Recipe updated!');
                navigation.goBack();
            } else {
                // Link the recipe to the logged-in user
                const payloadWithUser = {
                    ...payload,
                    user_id: user?.id,
                };
                await recipesAPI.create(payloadWithUser);
                showToast(publish ? 'Recipe published!' : 'Draft saved!');
                resetForm();
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <View style={{ width: 22 }} />
                    <Text style={styles.brand}>Digital Atelier</Text>
                    <View style={{ width: 22 }} />
                </View>

                {/* ── Hero Photo ──────────────────────────────────────────────────────── */}
                {/* Tapping this opens the device library via expo-image-picker.
                    The chosen image is uploaded to the server and the returned URL
                    is previewed immediately in the Image component below. */}
                <TouchableOpacity
                    style={styles.photoDrop}
                    onPress={pickHeroPhoto}
                    activeOpacity={0.92}
                    disabled={heroUpload.uploading}
                >
                    {form.photo_url ? (
                        // Show the actual uploaded image using its hosted URL
                        <Image source={{ uri: form.photo_url }} style={styles.photoPreview} />
                    ) : heroUpload.uploading ? (
                        <View style={styles.photoUploadingState}>
                            <ActivityIndicator color={COLORS.green} size="large" />
                            <Text style={styles.photoUploadingText}>Uploading photo…</Text>
                        </View>
                    ) : (
                        <View style={styles.photoEmptyState}>
                            <Feather name="camera" size={28} color={COLORS.muted} />
                            <Text style={styles.photoTitle}>Add a cover photo</Text>
                            <Text style={styles.photoSub}>Tap to choose from your library</Text>
                        </View>
                    )}

                    {/* Change photo button when an image is already selected */}
                    {form.photo_url && !heroUpload.uploading && (
                        <View style={styles.changePhotoOverlay}>
                            <Feather name="camera" size={14} color={COLORS.white} />
                            <Text style={styles.changePhotoText}>Change Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* ── Title ── */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Recipe Title</Text>
                    <TextInput
                        style={[styles.titleInput, errors.title && styles.errorOutline]}
                        value={form.title}
                        onChangeText={v => setField('title', v)}
                        placeholder="e.g. Heirloom Tomato Tart"
                        placeholderTextColor="#D4CEC4"
                    />
                    {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
                </View>

                {/* ── Story ── */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>The Story</Text>
                    <TextInput
                        style={styles.textarea}
                        value={form.story}
                        onChangeText={v => setField('story', v)}
                        placeholder="Share the inspiration behind this dish..."
                        placeholderTextColor={COLORS.placeholder}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* ── Category ── */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {CATEGORIES.map(cat => {
                                const sel = form.category === cat.key;
                                const iconName = CAT_ICONS[cat.label] || 'grid';
                                return (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[styles.catChip, sel && styles.catChipActive]}
                                        onPress={() => setField('category', cat.key)}
                                        activeOpacity={0.85}
                                    >
                                        <Feather name={iconName} size={14} color={sel ? COLORS.white : COLORS.sage} />
                                        <Text style={[styles.catText, sel && styles.catTextActive]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                {/* ── Meta row ── */}
                <View style={[styles.fieldGroup, { marginTop: 10 }]}>
                    <View style={styles.metaRow}>
                        {[
                            { field: 'prep_time', label: 'PREP (min)' },
                            { field: 'cook_time', label: 'COOK (min)' },
                            { field: 'servings',  label: 'SERVINGS'  },
                        ].map(({ field, label }) => (
                            <View key={field} style={[styles.metaCard, { flex: 1 }]}>
                                <Text style={styles.metaLabel}>{label}</Text>
                                <TextInput
                                    style={styles.metaInput}
                                    value={form[field]}
                                    onChangeText={v => setField(field, v)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={COLORS.placeholder}
                                />
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Difficulty ── */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Difficulty</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {DIFFICULTIES.map(d => {
                            const sel = form.difficulty === d;
                            const colors = { Easy: '#16A34A', Medium: '#CA8A04', Hard: '#DC2626' };
                            return (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.diffBtn, sel && { backgroundColor: colors[d] + '18', borderColor: colors[d] }]}
                                    onPress={() => setField('difficulty', d)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={[styles.diffText, sel && { color: colors[d], fontFamily: FONTS.sansBold }]}>
                                        {d}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Ingredients ── */}
                <View style={styles.fieldGroup}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ingredients</Text>
                    </View>
                    {errors.ingredients ? (
                        <Text style={[styles.errorText, { marginBottom: 8 }]}>{errors.ingredients}</Text>
                    ) : null}

                    <View style={styles.stackList}>
                        {form.ingredients.map((ing, i) => (
                            <View key={`ing-${i}`} style={styles.ingRow}>
                                <Text style={styles.dragDots}>⋮⋮</Text>
                                <TextInput
                                    style={styles.qtyInput}
                                    value={ing.qty}
                                    onChangeText={v => updateIngredient(i, 'qty', v)}
                                    placeholder="1 tsp"
                                    placeholderTextColor={COLORS.placeholder}
                                />
                                <TextInput
                                    style={styles.nameInput}
                                    value={ing.name}
                                    onChangeText={v => updateIngredient(i, 'name', v)}
                                    placeholder="Ingredient name..."
                                    placeholderTextColor={COLORS.placeholder}
                                />
                                {form.ingredients.length > 1 && (
                                    <TouchableOpacity
                                        onPress={() => removeIngredient(i)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons name="close" size={16} color={COLORS.muted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.addStepBtn} onPress={addIngredient} activeOpacity={0.88}>
                        <Feather name="plus" size={14} color={COLORS.muted} />
                        <Text style={styles.addStepText}>Add ingredient</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Instructions ── */}
                <View style={styles.fieldGroup}>
                    <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                    </View>
                    {errors.instructions ? (
                        <Text style={[styles.errorText, { marginBottom: 8 }]}>{errors.instructions}</Text>
                    ) : null}

                    <View style={styles.stackList}>
                        {form.instructions.map((step, i) => (
                            <View key={`step-${i}`} style={styles.stepCard}>
                                <View style={styles.stepHeader}>
                                    <View style={styles.stepBadge}>
                                        <Text style={styles.stepBadgeText}>{i + 1}</Text>
                                    </View>
                                    <Text style={styles.stepLabel}>Step {i + 1}</Text>
                                    {form.instructions.length > 1 && (
                                        <TouchableOpacity
                                            onPress={() => removeStep(i)}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Ionicons name="close" size={16} color={COLORS.muted} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TextInput
                                    style={styles.stepInput}
                                    value={step.text}
                                    onChangeText={v => updateStep(i, 'text', v)}
                                    placeholder="Describe this step..."
                                    placeholderTextColor={COLORS.placeholder}
                                    multiline
                                    textAlignVertical="top"
                                />

                                {/* Step photo — same upload flow as hero photo */}
                                {step.photo_url ? (
                                    <View style={{ marginTop: 10 }}>
                                        <Image
                                            source={{ uri: step.photo_url }}
                                            style={styles.stepPhoto}
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity onPress={() => updateStep(i, 'photo_url', '')}>
                                            <Text style={styles.removePhotoText}>Remove photo</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.stepPhotoPlaceholder}
                                        onPress={() => pickStepPhoto(i)}
                                        disabled={stepUpload.uploading}
                                        activeOpacity={0.9}
                                    >
                                        {stepUpload.uploading ? (
                                            <ActivityIndicator color={COLORS.muted} size="small" />
                                        ) : (
                                            <>
                                                <Feather name="camera" size={16} color={COLORS.muted} />
                                                <Text style={styles.stepPhotoText}>Add a photo for this step</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.addStepBtn} onPress={addStep} activeOpacity={0.88}>
                        <Feather name="plus" size={14} color={COLORS.muted} />
                        <Text style={styles.addStepText}>Add next step</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Actions ── */}
                <View style={styles.fieldGroup}>
                    <TouchableOpacity
                        style={[styles.publishBtn, saving && { opacity: 0.6 }]}
                        onPress={() => handleSave(true)}
                        disabled={saving}
                        activeOpacity={0.9}
                    >
                        {saving
                            ? <ActivityIndicator color={COLORS.white} />
                            : <Text style={styles.publishBtnText}>
                                {editRecipe ? 'Save Changes' : 'Publish Recipe'}
                              </Text>
                        }
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.cream },
    screen: { flex: 1 },
    content: { paddingHorizontal: 8, paddingBottom: 110 },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 4,
        paddingBottom: 14,
    },
    iconBtn: { width: 22, alignItems: 'center' },
    brand: { fontFamily: FONTS.sansBold, fontSize: 18, color: COLORS.green, letterSpacing: -0.5 },

    // Hero photo drop zone
    photoDrop: {
        height: 180,
        borderRadius: 14,
        backgroundColor: COLORS.warm,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginHorizontal: 14,
        marginBottom: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    photoEmptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    photoUploadingState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    photoUploadingText: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        color: COLORS.muted,
    },
    photoTitle: { fontFamily: FONTS.sansBold, fontSize: 13, color: '#53604B' },
    photoSub: { fontFamily: FONTS.sans, fontSize: 11, color: '#9A9489' },
    changePhotoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    changePhotoText: { fontFamily: FONTS.sansMed, fontSize: 12, color: COLORS.white },

    fieldGroup: { marginHorizontal: 14, marginBottom: 16 },
    label: {
        fontFamily: FONTS.sansBold,
        fontSize: 9,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: '#A9A396',
        marginBottom: 7,
    },
    titleInput: {
        fontFamily: FONTS.serif,
        fontSize: 28,
        lineHeight: 32,
        color: COLORS.ink,
        paddingVertical: 2,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    textarea: {
        minHeight: 72,
        borderRadius: 10,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 10,
        fontFamily: FONTS.sans,
        fontSize: 12,
        lineHeight: 17,
        color: '#5C554B',
        ...SHADOWS.sm,
    },
    errorOutline: { borderBottomColor: COLORS.red },
    errorText: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.red, marginTop: 4 },

    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    catChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
    catText: { fontFamily: FONTS.sansMed, fontSize: 12, color: COLORS.muted },
    catTextActive: { color: COLORS.white },

    metaRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    metaCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
    },
    metaLabel: { fontFamily: FONTS.sansBold, fontSize: 9, letterSpacing: 1, color: '#A09A90', marginBottom: 6 },
    metaInput: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.ink },

    diffBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        alignItems: 'center',
    },
    diffText: { fontFamily: FONTS.sansMed, fontSize: 13, color: COLORS.muted },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sectionTitle: { fontFamily: FONTS.serifMed, fontSize: 18, color: COLORS.ink },
    sectionAction: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.green },

    stackList: { gap: 10, marginBottom: 12 },
    ingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    dragDots: { fontSize: 12, color: '#C8C1B6' },
    qtyInput: {
        width: 70,
        borderRadius: 8,
        backgroundColor: COLORS.warm,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontFamily: FONTS.sansMed,
        fontSize: 12,
        color: '#635B51',
    },
    nameInput: {
        flex: 1,
        borderRadius: 8,
        backgroundColor: COLORS.warm,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontFamily: FONTS.sans,
        fontSize: 12,
        color: '#635B51',
    },
    removeBtn: { fontSize: 13, color: COLORS.muted, paddingHorizontal: 4 },

    stepCard: { backgroundColor: 'transparent', paddingBottom: 6 },
    stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.green,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBadgeText: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.white },
    stepLabel: { flex: 1, fontFamily: FONTS.sansBold, fontSize: 11, color: '#A39C91' },
    stepInput: {
        minHeight: 80,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 10,
        fontFamily: FONTS.sans,
        fontSize: 13,
        lineHeight: 18,
        color: '#5C554B',
    },
    stepPhoto: { width: '100%', height: 160, borderRadius: 10, marginTop: 10 },
    removePhotoText: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.orange, marginTop: 6 },
    stepPhotoPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        height: 44,
        borderRadius: 10,
        backgroundColor: COLORS.warm,
        paddingHorizontal: 14,
    },
    stepPhotoText: { fontFamily: FONTS.sansMed, fontSize: 12, color: COLORS.muted },

    addStepBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 28,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: COLORS.border,
    },
    addStepText: { fontFamily: FONTS.sansMed, fontSize: 12, color: COLORS.muted },

    draftBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        marginBottom: 12,
        borderRadius: 50,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.sm,
    },
    draftBtnText: {
        fontFamily: FONTS.sansBold,
        fontSize: 14,
        color: COLORS.ink,
    },
    publishBtn: {
        borderRadius: 50,
        backgroundColor: COLORS.green,
        alignItems: 'center',
        paddingVertical: 15,
        ...SHADOWS.md,
    },
    publishBtnText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.white },
});