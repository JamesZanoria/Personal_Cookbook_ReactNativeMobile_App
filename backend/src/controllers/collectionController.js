const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const getAll = async (req, res) => {
    try{
        const [rows] = await db.query(
            `SELECT c.*, COUNT(cr.recipe_id) AS recipe_count
            FROM collections c
            LEFT JOIN collection_recipes cr ON cr.collection_id = c.id
            WHERE c.user_id = ?
            GROUP BY c.id
            ORDER BY c.created_at DESC`,
            [req.user.id]
        );
        return res.json(rows);
    } catch(err){
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// GET collections
const getOne = async (req, res) => {
    try{
        const [cols] = await db.query(
            'SELECT * FROM collections WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if(!cols.length) return res.status(404).json({ error: 'Collection not found' });

        const [recipes] = await db.query(
            `SELECT r.*, u.name AS author_name,
                    COALESCE(ROUND((SELECT AVG(rv.rating) FROM reviews rv WHERE rv.recipe_id = r.id), 1), 0) AS avg_rating,
                    (SELECT COUNT(*) FROM saved_recipes sr WHERE sr.recipe_id = r.id) AS save_count
            FROM collection_recipes cr
            JOIN recipes r ON r.id = cr.recipe_id
            JOIN users u ON u.id = r.user_id
            WHERE cr.collection_id = ?
            ORDER BY cr.added_at DESC`,
            [req.params.id]
        );

        return res.json({ ...cols[0], recipes });
    } catch(err){
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// POST
const create = async (req, res) => {
    try{
        const { name, description, cover_url } = req.body;
        if(!name) return res.status(400).json({ error: 'name is required' });

        const id = uuidv4();
        await db.query(
            'INSERT INTO collections (id, user_id, name, description, cover_url) VALUES (?, ?, ?, ?, ?)',
            [id, req.user.id, name, description || null, cover_url || null]
        );

        const [rows] = await db.query('SELECT * FROM collections WHERE id = ?', [id]);
        return res.status(201).json(rows[0]);
    } catch(err){
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// PUT
const update = async (req, res) => {
    try{
        const [rows] = await db.query(
            'SELECT * FROM collections WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if(!rows.length) return res.status(404).json({ error: 'Collection not found' });

        const { name, description, cover_url } = req.body;
        await db.query(
            `UPDATE collections SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                cover_url = COALESCE(?, cover_url)
            WHERE id = ?`,
            [name || null, description || null, cover_url || null, req.params.id]
        );

        const [updated] = await db.query('SELECT * FROM collections WHERE id = ?', [req.params.id]);
        return res.json(updated[0]);
    } catch(err){
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// DELETE
const remove = async (req, res) => {
    try{
        const [rows] = await db.query(
            'SELECT id FROM collections WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if(!rows.length) return res.status(404).json({ error: 'Collection not found' });

        await db.query('DELETE FROM collections WHERE id = ?', [req.params.id]);
        return res.json({ message: 'Collection deleted' });
    } catch(err){
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// POST collections -- recipe
const addRecipe = async (req, res) => {
    try{
        const [collections] = await db.query(
            'SELECT id FROM collections WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if(!collections.length) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        await db.query(
            'INSERT IGNORE INTO collection_recipes (collection_id, recipe_id) VALUES (?, ?)',
            [req.params.id, req.params.recipeId]
        );
        await db.query(
            `UPDATE collections c
             JOIN recipes r ON r.id = ?
             SET c.cover_url = COALESCE(c.cover_url, r.photo_url)
             WHERE c.id = ?`,
            [req.params.recipeId, req.params.id]
        );
        return res.json({ message: 'Recipe added to collection' });
    } catch(err){
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// DELETE collections == recipe
const removeRecipe = async (req, res) => {
    try{
        await db.query(
            'DELETE FROM collection_recipes WHERE collection_id = ? AND recipe_id = ?',
            [req.params.id, req.params.recipeId]
        );
        return res.json({ message: 'Recipe removed from collection' });
    } catch(err){
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = { getAll, getOne, create, update, remove, addRecipe, removeRecipe };
