import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('uploads'));

// Use memory storage to temporarily hold the file
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.get('/', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.render('upload', { files: files });
        }
    });
});

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded or file type not allowed.');
    }

    const fileName = req.file.originalname.split('.')[0] + '-' + Date.now() + path.extname(req.file.originalname);
    const filePath = path.join('uploads', fileName);

    try {
        if (req.file.mimetype.startsWith('image/')) {
            // Resize the image and save to disk
            await sharp(req.file.buffer)
                .resize(300)
                .toFile(filePath);
        } else {
            // Save PDF as it is
            fs.writeFileSync(filePath, req.file.buffer);
        }

        res.redirect('/');
    } catch (error) {
        res.status(500).send('Error processing file');
    }
});

app.listen(7000, () => {
    console.log('Server started');
});
