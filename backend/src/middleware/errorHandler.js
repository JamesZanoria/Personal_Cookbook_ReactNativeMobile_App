// Global error handler
module.exports = function errorHandler(err, _req, res, _next){
    console.error('[ERROR]', err);

    // Multer file size error
    if(err.code === 'LIMIT_FILE_SIZE'){
        return res.status(413).json({ error: 'File too large. Max 10MB.' });
    }

    // MySQL duplicate entry
    if(err.code === 'ER_DUP_ENTRY'){
        return res.status(409).json({ error: 'Duplicate entry' });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(status).json({ error: message });
};