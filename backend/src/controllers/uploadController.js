const uploadImage = (req, res) => {
    if(!req.file){
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(201).json({
        url: imageUrl,
        filename: req.file.filename,
    });
};

module.exports = { uploadImage };