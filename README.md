## Project Overview

Personal Cookbook is a full-stack recipe management application with:
- **Backend**: Node.js/Express REST API with MySQL database
- **Mobile**: React Native (Expo) iOS/Android app

## Commands

### Backend
```bash
cd backend
npm run dev      # Start API server with nodemon (port 3001)
npm start        # Start production server
```

### Mobile App
```bash
cd Personal_Cookbook
npm start        # Start Expo dev server
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
```

### Database
- MySQL database: `personal_cookbook`
- Schema located in `backend/db/digital_atelier.sql`
- Docker: `docker-compose up` runs the API container (requires MySQL on host)

## Architecture

### Backend (`backend/`)
- `src/app.js` - Express entry point, registers middleware and routes
- `src/routes/` - API route handlers (`/api/auth`, `/api/recipes`, `/api/collections`, `/api/uploads`)
- `src/controllers/` - Business logic for auth, recipes, collections, uploads
- `src/middleware/` - JWT auth verification, error handling, file upload handling
- `src/config/db.js` - MySQL connection pool (mysql2)
- `uploads/` - Static file serving for recipe images

### Mobile App (`Personal_Cookbook/`)
- `App.js` - Root component with font loading, auth state, navigation
- `src/navigation/` - React Navigation setup (Bottom tabs + Stack)
- `src/screens/` - Main screens: Discover, Cookbook, Create, Detail, Login, Register
- `src/components/` - Reusable UI: RecipeCard, Toast, StepBlock, IngredientRow
- `src/api/` - Axios client with JWT interceptor, API modules for auth/recipes/collections/uploads
- `src/context/AuthContext.jsx` - Auth state management, session persistence
- `src/hooks/` - Custom hooks: useRecipes, useCollections, useUpload
- `src/utils/` - Storage (SecureStore), validation, formatting utilities
- `src/constants/` - Colors, fonts, categories

## Key Patterns

- **Auth**: JWT tokens stored in Expo SecureStore; axios interceptor attaches `Authorization: Bearer <token>`; 401 responses trigger auto-logout
- **API client**: `src/api/client.js` creates axios instance with base URL from env or platform fallback; includes request/response interceptors for auth
- **Database**: Connection pool with automatic JSON parsing for MySQL JSON columns
- **File uploads**: Multer middleware handles image uploads served from `/uploads`
- **State management**: AuthContext provides global user state and authentication methods (login, logout, update)
- **Styling**: Centralized color, font, and dimension constants in `src/constants/` for consistent theming

## Environment Variables

**Backend** (`.env`):
- `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`

**Mobile** (`.env`):
- `EXPO_PUBLIC_API_BASE_URL` (defaults to localhost:3001/api)

## Development Workflow

1. **Backend Development**:
   - Run `npm run dev` in the `backend` directory to start the API server with hot reloading
   - The API server runs on `http://localhost:3001` by default
   - Environment variables must be set in `backend/.env` (see above)

2. **Mobile App Development**:
   - Run `npm start` in the `Personal_Cookbook` directory to start the Expo development server
   - Use `npm run ios` or `npm run android` to launch simulators/emulators
   - The app connects to the backend via `EXPO_PUBLIC_API_BASE_URL` (configured in `.env`)

3. **Database Setup**:
   - Ensure MySQL is running and accessible
   - The database `personal_cookbook` will be created automatically on first connection
   - Schema is defined in `backend/db/digital_atelier.sql` and executed on connection
   - To reset the database, drop and recreate the `personal_cookbook` database

4. **Testing**:
   - Currently, there are no automated tests configured. Manual testing is recommended via the Expo simulator/emulator and API testing tools (e.g., Postman, curl).

5. **Debugging**:
   - Backend logs are visible in the terminal where `npm run dev` is running
   - Mobile app logs can be viewed via Expo DevTools or `adb logcat` / Xcode console
   - React Native debugging can be enabled via the Developer menu in the simulator/emulator

## Privacy and Security

- Sensitive files (environment variables, node_modules, build artifacts) are excluded from version control via `.gitignore` files in the root and `backend/` directory
- Uploaded images are stored in `backend/uploads/` and served statically; this directory is also ignored by Git
- Never commit `.env` files or any files containing secrets# Personal_Cookbook_ReactNativeMobile_App
