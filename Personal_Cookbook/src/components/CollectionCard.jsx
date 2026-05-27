import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet, } from 'react-native';
import { COLORS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';

export default function CollectionCard({ collection, onPress }){
    return(
        <TouchableOpacity style={styles.card} onPress={() => onPress(collection)} activeOpacity={0.92}>
            <ImageBackground
                source={collection.cover_url ? {uri: collection.cover_url } : null}
                style={styles.bg}
                imageStyle={{ borderRadius: 14 }}
            >
                {/* Fallback background */}
                {!collection.cover_url && <View style={styles.fallback} />}

                <View style={styles.overlay} />

                <View style={styles.body}>
                    <Text style={styles.count}>
                        {collection.recipe_count || 0} recipes
                    </Text>
                    <Text style={styles.name} numberOfLines={1}>
                        {collection.name}
                    </Text>
                    {collection.description ? (
                        <Text style={styles.desc} numberOfLines={2}>
                            {collection.description}
                        </Text>
                    ) : null}
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        overflow: 'hidden',
        height: 110,
        marginBottom: 10,
        ...SHADOWS.md,
    },
    bg: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    fallback: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.green,
        borderRadius: 14,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 14,
    },
    body: {
        padding: 16,
    },
    count: {
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.xs,
        color: 'rgba(255,255,255,0.65)',
        marginBottom: 2,
    },
    name: {
        fontFamily: FONTS.serif,
        fontSize: FONT_SIZES.lg,
        color: COLORS.white,
        fontWeight: '700',
    },
    desc: {
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZES.xs,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
});