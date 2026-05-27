export const formatTime = (mins) => {
    if(!mins) return null;
    if(mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
};

export const formatDate = (dateStr) => {
    if(!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

export const ingredientCount = (ingredients) => {
    if(!ingredients) return 0;
    const arr = typeof ingredients === 'string'
        ? JSON.parse(ingredients)
        : ingredients;
    return Array.isArray(arr) ? arr.length : 0;
};

export const truncate = (str, maxLen = 80) => {
    if(!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
};

export const round1 = (n) => Math.round((n || 0) * 10) / 10;