-- PostgreSQL Schema for Personal Cookbook

  -- Types for ENUMs
  CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');
  CREATE TYPE recipe_source AS ENUM ('local', 'mealdb');

  -- Tables
  CREATE TABLE users (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE recipes (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      story TEXT,
      category VARCHAR(50),
      difficulty difficulty_level NOT NULL DEFAULT 'Easy',
      prep_time INT,
      cook_time INT,
      servings INT,
      ingredients JSONB NOT NULL,
      instructions JSONB NOT NULL,
      photo_url TEXT,
      is_published BOOLEAN NOT NULL DEFAULT FALSE,
      source recipe_source NOT NULL DEFAULT 'local',
      external_id VARCHAR(50) DEFAULT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      like_count INT NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE collections (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      cover_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE collection_recipes (
      collection_id VARCHAR(36) NOT NULL,
      recipe_id VARCHAR(36) NOT NULL,
      added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (collection_id, recipe_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE saved_recipes (
      user_id VARCHAR(36) NOT NULL,
      recipe_id VARCHAR(36) NOT NULL,
      saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, recipe_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE reviews (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      recipe_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      body TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (recipe_id, user_id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE recipe_likes (
      user_id VARCHAR(36) NOT NULL,
      recipe_id VARCHAR(36) NOT NULL,
      liked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, recipe_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  -- Indexes
  CREATE INDEX idx_recipes_user ON recipes(user_id);
  CREATE INDEX idx_recipes_category ON recipes(category);
  CREATE INDEX idx_recipes_published ON recipes(is_published);
  CREATE INDEX idx_collection_user ON collections(user_id);
  CREATE INDEX idx_reviews_recipe ON reviews(recipe_id);
  CREATE INDEX idx_saved_user ON saved_recipes(user_id);

  -- Automatic Updated_At Trigger
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
  END;
  $$ language 'plpgsql';

  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();