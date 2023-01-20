const multer = require('multer');
const readXlsxFile = require('read-excel-file/node');
const upload = multer({ storage: multer.memoryStorage() });
app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    readXlsxFile(file.buffer).then((rows) => {
        setDataCsv(rows);
        res.send('File uploaded successfully!');
    });
});
//# sourceMappingURL=index.js.map