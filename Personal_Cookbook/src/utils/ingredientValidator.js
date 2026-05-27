/**
 * Utility for validating ingredients and providing autocomplete suggestions.
 */

const ALIASES = {
  'coriander': 'cilantro',
  'courgette': 'zucchini',
  'aubergine': 'eggplant',
  'capsicum': 'bell pepper',
  'spring onion': 'green onion',
};

/**
 * Calculates the Levenshtein distance between two strings.
 * Used for fuzzy matching.
 */
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  let prevRow = Array.from({ length: a.length + 1 }, (_, i) => i);
  let currRow = new Array(a.length + 1);

  for (let i = 1; i <= b.length; i++) {
    currRow[0] = i;
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        currRow[j] = prevRow[j - 1];
      } else {
        currRow[j] = Math.min(
          prevRow[j - 1] + 1, // substitution
          currRow[j - 1] + 1, // insertion
          prevRow[j] + 1      // deletion
        );
      }
    }
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[a.length];
}

/**
 * Validates an ingredient term against a list of valid ingredients.
 * Returns { isValid, suggestion }
 *
 * @param {string} term - The ingredient to validate.
 * @param {string[]} validList - List of all valid ingredients.
 * @returns {{isValid: boolean, suggestion: string|null}}
 */
export function validateIngredient(term, validList) {
  if (!term) return { isValid: false, suggestion: null };
  if (!Array.isArray(validList)) return { isValid: false, suggestion: null };

  const normalizedTerm = term.toLowerCase().trim();

  // 1. Check if it's exactly in the valid list
  const exactMatch = validList.find(item => String(item).toLowerCase() === normalizedTerm);
  if (exactMatch) {
    return { isValid: true, suggestion: exactMatch };
  }

  // 2. Check for aliases
  const alias = ALIASES[normalizedTerm];
  if (alias) {
    const aliasMatch = validList.find(item => String(item).toLowerCase() === alias.toLowerCase());
    if (aliasMatch) {
      return { isValid: true, suggestion: aliasMatch };
    }
  }

  // 3. Fuzzy match using Levenshtein distance
  let bestMatch = null;
  let minDistance = Infinity;

  for (const item of validList) {
    const sItem = String(item);
    if (Math.abs(normalizedTerm.length - sItem.length) >= minDistance) continue;
    const distance = levenshtein(normalizedTerm, sItem.toLowerCase());
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = item;
    }
  }

  // Match if distance is less than 3 (typically handles 1-2 typos)
  if (minDistance < 3) {
    return { isValid: false, suggestion: bestMatch };
  }

  return { isValid: false, suggestion: null };
}

/**
 * Gets a list of suggested ingredients based on a prefix match.
 *
 * @param {string} term - The partial term entered by the user.
 * @param {string[]} validList - List of all valid ingredients.
 * @returns {string[]} Top 5 prefix matches.
 */
export function getSuggestions(term, validList) {
  if (!term) return [];
  if (!Array.isArray(validList)) return [];

  const normalizedTerm = term.toLowerCase().trim();

  const matches = validList.filter(item =>
    String(item).toLowerCase().startsWith(normalizedTerm)
  );

  return matches.slice(0, 5);
}
