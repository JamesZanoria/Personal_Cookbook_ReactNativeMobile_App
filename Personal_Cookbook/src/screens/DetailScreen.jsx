import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { recipesAPI } from '../api/recipes';
import { showToast } from '../components/Toast';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { formatTime } from '../utils/format';
import { DIFFICULTY_COLORS } from '../constants/categories';

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1514517220017-8ce97a34a7b6?auto=format&fit=crop&w=1400&q=80';

function parseMaybeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { 
        const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; 
    } catch { 
        return []; 
    }
  }
  return [];
}

function ReviewForm({ recipeId, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      showToast('Please select a star rating', 'error');
      return;
    }

    try {
      setSaving(true);
      const review = await recipesAPI.addReview(recipeId, { rating, body: body.trim() || null });
      onSubmit(review, rating);
      setRating(0);
      setBody('');
      showToast('Review posted!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.reviewForm}>
      <Text style={s.reviewFormLabel}>LEAVE A REVIEW</Text>
      <View style={s.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {star <= rating
              ? <Ionicons name="star" size={28} color={COLORS.gold} />
              : <Feather name="star" size={26} color={COLORS.border} />}
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={s.reviewInput}
        value={body}
        onChangeText={setBody}
        placeholder="Share your thoughts…"
        placeholderTextColor={COLORS.placeholder}
        multiline
        textAlignVertical="top"
      />
      <TouchableOpacity style={[s.reviewSubmitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
        {saving
          ? <ActivityIndicator color={COLORS.white} size="small" />
          : <>
              <Feather name="send" size={14} color={COLORS.white} />
              <Text style={s.reviewSubmitText}>Post Review</Text>
            </>}
      </TouchableOpacity>
    </View>
  );
}

export default function DetailScreen({ route, navigation }) {
  const recipeId = route.params?.recipeId;
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [checked, setChecked] = useState({});

  const loadRecipe = useCallback(async () => {
    if (!recipeId) {
      setLoading(false);
      return;
    }

    try {
      const data = await recipesAPI.getOne(recipeId);
      setRecipe(data);
    } catch {
      showToast('Failed to load recipe', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, recipeId]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const ingredients = useMemo(() => parseMaybeArray(recipe?.ingredients), [recipe]);
  const instructions = useMemo(() => parseMaybeArray(recipe?.instructions), [recipe]);
  const reviews = useMemo(() => (Array.isArray(recipe?.reviews) ? recipe.reviews : []), [recipe]);
  const diffColors = DIFFICULTY_COLORS[recipe?.difficulty] || DIFFICULTY_COLORS.Easy;
  const isOwner = user?.id === recipe?.user_id;

  const handleToggleSave = async () => {
    try {
      setSaveLoading(true);
      const result = await recipesAPI.toggleSave(recipe.id);
      setRecipe((current) => ({
        ...current,
        is_saved: result.saved,
        save_count: result.save_count ?? Math.max((current.save_count || 0) + (result.saved ? 1 : -1), 0),
      }));
      showToast(result.saved ? 'Saved to cookbook!' : 'Removed from cookbook');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // This heart action gives the recipe a persistent engagement signal used by Discover trending.
  const handleToggleLike = async () => {
    try {
      setLikeLoading(true);
      const result = await recipesAPI.toggleLike(recipe.id);
      setRecipe((current) => ({
        ...current,
        is_liked: result.liked,
        like_count: result.like_count ?? Math.max((current.like_count || 0) + (result.liked ? 1 : -1), 0),
      }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Recipe', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await recipesAPI.remove(recipe.id);
            showToast('Recipe deleted');
            navigation.goBack();
          } catch (err) {
            showToast(err.message, 'error');
          }
        },
      },
    ]);
  };

  const handleReviewSubmit = (newReview, newRating) => {
    setRecipe((current) => {
      const nextReviews = [newReview, ...(current.reviews || [])];
      const nextCount = (current.review_count || 0) + 1;
      const total = (current.avg_rating || 0) * (current.review_count || 0) + newRating;
      return {
        ...current,
        reviews: nextReviews,
        review_count: nextCount,
        avg_rating: Number((total / nextCount).toFixed(1)),
      };
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={s.loadSafe}>
        <ActivityIndicator color={COLORS.green} size="large" />
      </SafeAreaView>
    );
  }
  if (!recipe) return null;

  return (
    <SafeAreaView style={s.safe} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.heroShell}>
          <Image source={{ uri: recipe.photo_url || HERO_FALLBACK }} style={s.heroImage} />
          <View style={s.heroShade} />

          <View style={s.heroNav}>
            <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
              <Feather name="chevron-left" size={22} color={COLORS.white} />
            </TouchableOpacity>

            <Text style={s.heroBrand}>Digital Atelier</Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {isOwner ? (
                <>
                  <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate('CreateModal', { recipe })}>
                    <Feather name="edit-2" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.navBtn} onPress={handleDelete}>
                    <Feather name="trash-2" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>

          <View style={s.heroContent}>
            {recipe.category ? (
              <View style={s.categoryPill}>
                <Text style={s.categoryPillText}>{recipe.category.toUpperCase()}</Text>
              </View>
            ) : null}
            <Text style={s.heroTitle}>{recipe.title}</Text>
            <View style={s.heroSubRow}>
              <Feather name="user" size={11} color="rgba(255,255,255,0.75)" />
              <Text style={s.heroSub}>
                {recipe.author_name || 'Anonymous'}
                {recipe.difficulty ? `  ·  ${recipe.difficulty}` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.statsRow}>
          {recipe.prep_time ? (
            <View style={s.statCard}>
              <Feather name="clock" size={16} color={COLORS.sage} style={{ marginBottom: 4 }} />
              <Text style={s.statLabel}>Prep</Text>
              <Text style={s.statValue}>{formatTime(recipe.prep_time)}</Text>
            </View>
          ) : null}
          {recipe.cook_time ? (
            <View style={s.statCard}>
              <Feather name="clock" size={16} color={COLORS.sage} style={{ marginBottom: 4 }} />
              <Text style={s.statLabel}>Cook</Text>
              <Text style={s.statValue}>{formatTime(recipe.cook_time)}</Text>
            </View>
          ) : null}
          {recipe.servings ? (
            <View style={s.statCard}>
              <Feather name="users" size={16} color={COLORS.sage} style={{ marginBottom: 4 }} />
              <Text style={s.statLabel}>Serves</Text>
              <Text style={s.statValue}>{recipe.servings}</Text>
            </View>
          ) : null}
          {recipe.difficulty ? (
            <View style={[s.statCard, { backgroundColor: diffColors.bg }]}>
              <Feather name="bar-chart-2" size={16} color={diffColors.text} style={{ marginBottom: 4 }} />
              <Text style={s.statLabel}>Level</Text>
              <Text style={[s.statValue, { color: diffColors.text }]}>{recipe.difficulty}</Text>
            </View>
          ) : null}
        </View>

        {/* Save + like are grouped here so Detail has one clean action area instead of repeated buttons. */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.primaryActionBtn} onPress={handleToggleSave} disabled={saveLoading}>
            {recipe.is_saved ? <Ionicons name="bookmark" size={16} color={COLORS.white} /> : <Feather name="bookmark" size={16} color={COLORS.white} />}
            <Text style={s.primaryActionText}>{recipe.is_saved ? `Saved (${recipe.save_count || 0})` : `Save (${recipe.save_count || 0})`}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryActionBtn} onPress={handleToggleLike} disabled={likeLoading}>
            <Ionicons name={recipe.is_liked ? 'heart' : 'heart-outline'} size={16} color={recipe.is_liked ? COLORS.orange : COLORS.ink} />
            <Text style={s.secondaryActionText}>{recipe.like_count || 0} Likes</Text>
          </TouchableOpacity>
        </View>

        <View style={s.body}>
          {recipe.story ? (
            <View style={s.quoteBlock}>
              <Text style={s.quoteText}>"{recipe.story}"</Text>
            </View>
          ) : null}

          <View style={s.secHeader}>
            <Text style={s.secTitle}>Ingredients</Text>
            {recipe.servings ? (
              <View style={s.secMetaRow}>
                <Feather name="users" size={11} color={COLORS.muted} />
                <Text style={s.secMeta}>Yields {recipe.servings} servings</Text>
              </View>
            ) : null}
          </View>

          {ingredients.length ? (
            <View style={s.ingList}>
              {ingredients.map((ingredient, index) => (
                <TouchableOpacity
                  key={index}
                  style={s.ingRow}
                  onPress={() => setChecked((current) => ({ ...current, [index]: !current[index] }))}
                  activeOpacity={0.7}
                >
                  <View style={[s.checkbox, checked[index] && s.checkboxChecked]}>
                    {checked[index] ? <Feather name="check" size={12} color={COLORS.white} /> : null}
                  </View>
                  <Text style={[s.ingText, checked[index] && s.ingChecked]}>
                    {ingredient.qty ? <Text style={{ fontFamily: FONTS.sansBold }}>{ingredient.qty}  </Text> : null}
                    {ingredient.name || ingredient}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={s.emptyText}>No ingredients added.</Text>
          )}

          <Text style={[s.secTitle, { marginTop: 24, marginBottom: 14 }]}>Instructions</Text>
          {instructions.length ? (
            instructions.map((step, index) => (
              <View key={index} style={s.stepBlock}>
                <View style={s.stepMarker}>
                  <Text style={s.stepMarkerText}>{index + 1}</Text>
                </View>
                <View style={s.stepContent}>
                  {step.title || step.name ? <Text style={s.stepTitle}>{step.title || step.name}</Text> : null}
                  <Text style={s.stepText}>{step.text}</Text>
                  {step.photo_url ? <Image source={{ uri: step.photo_url }} style={s.stepImage} /> : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={s.emptyText}>No instructions added.</Text>
          )}

          <View style={s.secHeader}>
            <Text style={[s.secTitle, { marginTop: 8 }]}>Reviews</Text>
            {recipe.avg_rating > 0 ? (
              <View style={s.secMetaRow}>
                <Ionicons name="star" size={13} color={COLORS.gold} />
                <Text style={[s.secMeta, { color: COLORS.gold }]}>{recipe.avg_rating} ({recipe.review_count})</Text>
              </View>
            ) : null}
          </View>

          {user ? <ReviewForm recipeId={recipe.id} onSubmit={handleReviewSubmit} /> : null}

          {reviews.length ? (
            reviews.slice(0, 5).map((review, index) => (
              <View key={index} style={s.reviewCard}>
                <View style={s.reviewAvatar}>
                  <Text style={s.reviewAvatarText}>{(review.reviewer_name || 'U')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.reviewName}>{review.reviewer_name || 'Anonymous'}</Text>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {Array.from({ length: review.rating }).map((_, starIndex) => (
                        <Ionicons key={starIndex} name="star" size={11} color={COLORS.gold} />
                      ))}
                    </View>
                  </View>
                  {review.body ? <Text style={s.reviewBody}>"{review.body}"</Text> : null}
                </View>
              </View>
            ))
          ) : (
            <View style={s.reviewCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="message-circle" size={18} color={COLORS.border} />
                <Text style={s.emptyText}>No reviews yet. Be the first!</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.cream
    },
    loadSafe: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.cream
    },
    content: { 
        paddingBottom: 110 
    },
    heroShell: { 
        height: 360, 
        position: 'relative' 
    },
    heroImage: { 
        width: '100%', 
        height: '100%', 
        resizeMode: 'cover' 
    },
    heroShade: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.overlayDark
    },
    heroNav: { 
        position: 'absolute', 
        top: 52, 
        left: 16, 
        right: 16, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    navBtn: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        backgroundColor: 'rgba(0,0,0,0.3)', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    heroBrand: {
        fontFamily: FONTS.serifBold,
        fontSize: 14,
        color: COLORS.white
    },
    heroContent: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: 20 
    },
    categoryPill: { 
        alignSelf: 'flex-start', 
        backgroundColor: 'rgba(247,202,165,0.92)', 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 999, 
        marginBottom: 10 
    },
    categoryPillText: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 9, 
        letterSpacing: 0.7, 
        color: '#8E4C2E' 
    },
    heroTitle: { 
        fontFamily: FONTS.serif, 
        fontSize: 32, 
        lineHeight: 34, 
        color: COLORS.white, 
        maxWidth: '85%' 
    },
    heroSubRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6, 
        marginTop: 8 
    },
    heroSub: { 
        fontFamily: FONTS.sans, 
        fontSize: 12, 
        color: 'rgba(255,255,255,0.85)' 
    },
    statsRow: { 
        flexDirection: 'row', 
        gap: 10, 
        paddingHorizontal: 16, 
        marginTop: 16, 
        marginBottom: 12 
    },
    statCard: { 
        flex: 1, 
        backgroundColor: COLORS.card, 
        borderRadius: 14, 
        paddingVertical: 14, 
        alignItems: 'center', 
        ...SHADOWS.sm 
    },
    statLabel: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 9, 
        letterSpacing: 0.8, 
        textTransform: 'uppercase', 
        color: '#9A9489' 
    },
    statValue: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 13, 
        color: '#40392F' 
    },
    actionRow: { 
        flexDirection: 'row', 
        gap: 10, 
        paddingHorizontal: 16, 
        marginBottom: 4 
    },
    primaryActionBtn: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 7, 
        backgroundColor: COLORS.green, 
        borderRadius: 50, 
        paddingVertical: 13 
    },
    primaryActionText: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 13, 
        color: COLORS.white 
    },
    secondaryActionBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6, 
        paddingHorizontal: 18, 
        borderRadius: 50, 
        borderWidth: 1.5, 
        borderColor: COLORS.border, 
        paddingVertical: 13, 
        backgroundColor: COLORS.card 
    },
    secondaryActionText: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 13, 
        color: COLORS.ink 
    },
    body: { 
        padding: 16 
    },
    quoteBlock: { 
        borderLeftWidth: 3, 
        borderLeftColor: COLORS.green, 
        paddingLeft: 14, 
        marginBottom: 22 
    },
    quoteText: { 
        fontFamily: FONTS.serifReg, 
        fontSize: 14, 
        color: COLORS.muted, 
        lineHeight: 22, 
        fontStyle: 'italic' 
    },
    secHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12 
    },
    secTitle: { 
        fontFamily: FONTS.serifMed, 
        fontSize: 18, 
        color: '#332C24' 
    },
    secMetaRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4 
    },
    secMeta: { 
        fontFamily: FONTS.sansMed, 
        fontSize: 11, 
        color: '#9B958B' 
    },
    ingList: { 
        gap: 4, 
        marginBottom: 8 
    },
    ingRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.border 
    },
    checkbox: { 
        width: 22, 
        height: 22, 
        borderRadius: 6, 
        borderWidth: 1.5, 
        borderColor: COLORS.border, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    checkboxChecked: { 
        backgroundColor: COLORS.green, 
        borderColor: COLORS.green 
    },
    ingText: { 
        fontFamily: FONTS.sansMed, 
        fontSize: 14, 
        color: COLORS.ink, 
        flex: 1 
    },
    ingChecked: { 
        textDecorationLine: 'line-through', 
        color: COLORS.muted 
    },
    stepBlock: { 
        flexDirection: 'row', 
        gap: 14, 
        marginBottom: 18 
    },
    stepMarker: { 
        width: 30, 
        height: 30, 
        borderRadius: 15, 
        backgroundColor: COLORS.green, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 2, 
        flexShrink: 0 
    },
    stepMarkerText: { 
        fontFamily: FONTS.serif, 
        fontSize: 13, 
        color: COLORS.white, 
        fontWeight: '700' 
    },
    stepContent: { 
        flex: 1 
    },
    stepTitle: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 13, 
        color: '#302A23', 
        marginBottom: 6 
    },
    stepText: { 
        fontFamily: FONTS.sans, 
        fontSize: 13, 
        lineHeight: 20, 
        color: '#726C64' 
    },
    stepImage: { 
        marginTop: 10, 
        width: '100%', 
        height: 160, 
        borderRadius: 12, 
        resizeMode: 'cover' 
    },
    reviewForm: { 
        backgroundColor: COLORS.warm, 
        borderRadius: 14, 
        padding: 14, 
        marginBottom: 16 
    },
    reviewFormLabel: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 9, 
        color: COLORS.muted, 
        textTransform: 'uppercase', 
        letterSpacing: 0.8, 
        marginBottom: 10 
    },
    starsRow: { 
        flexDirection: 'row', 
        gap: 10, 
        marginBottom: 12 
    },
    reviewInput: { 
        backgroundColor: COLORS.card, 
        borderWidth: 1, 
        borderColor: COLORS.border, 
        borderRadius: 10, 
        padding: 10, 
        fontFamily: FONTS.sans, 
        fontSize: 13, 
        color: COLORS.ink, 
        minHeight: 64, 
        marginBottom: 10, 
        textAlignVertical: 'top' 
    },
    reviewSubmitBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 7, 
        backgroundColor: COLORS.green, 
        borderRadius: 50, 
        paddingVertical: 11 
    },
    reviewSubmitText: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 13, 
        color: COLORS.white 
    },
    reviewCard: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    reviewAvatar: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        backgroundColor: COLORS.green, 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexShrink: 0 
    },
    reviewAvatarText: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 13, 
        color: COLORS.white 
    },
    reviewName: { 
        fontFamily: FONTS.sansBold, 
        fontSize: 13, 
        color: COLORS.ink 
    },
    reviewBody: { 
        fontFamily: FONTS.sans, 
        fontSize: 12, 
        color: COLORS.muted, 
        marginTop: 4, 
        lineHeight: 18, 
        fontStyle: 'italic' 
    },
    emptyText: { 
        fontFamily: FONTS.sans, 
        fontSize: 13, 
        color: COLORS.muted, 
        fontStyle: 'italic' 
    },
});
