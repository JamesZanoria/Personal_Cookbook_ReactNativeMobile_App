export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validateRecipeForm = ({ title, ingredients, instructions }) => {
    const errors = {};
    if(!title?.trim()) errors.title = 'Title is required';
    if(!ingredients || ingredients.length === 0) errors.ingredients = 'Add at least one ingredient';
    if(!instructions || instructions.length === 0) errors.instructions = 'Add at least one instruction step';
    return errors;
};

export const validateAuthForm = ({ name, email, password }, isRegister = false) => {
    const errors = {};
    const isRegistration = isRegister || name !== undefined;
    if(isRegistration && !name?.trim()) errors.name = 'Name is required';
    if(!email?.trim()) errors.email = 'Email is required';
    else if(!validateEmail(email)) errors.email = 'Enter a valid email';
    if(!password?.trim()) errors.password = 'Password is required';
    else if(isRegistration && password.length < 6) errors.password = 'At least 6 characters';
    return errors;
};