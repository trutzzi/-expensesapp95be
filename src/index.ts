import express, { Request, Response } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
const cors = require('cors');

/**
 * TOOD: Make auto tagging on backend to eliminate lag
 * 
 */
const app = express();
// Use cors 
const whitelist = ['http://localhost:3001']
const corsOptions = {
    origin: (origin: any, callback: any) => {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error())
        }
    }
}

app.use(cors(corsOptions))
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
    const tags = JSON.parse(req.body.tags);
    console.log('received tags:', tags)
    // Get the uploaded file from the request
    const file = req.file;

    // Read the XLS file
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });

    // Get the first sheet
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Use sheet_to_json method to convert the sheet to a JSON array
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: "A" }) as any;

    // Send the JSON data as the response to the request

    let groupedValues = [];

    for (let i = 0; i < jsonData.length; i++) {
        let constructObj = { id: 0, dataCumparare: '', tip: '', valoare: '0', terminal: '' };

        // Check type
        if (jsonData[i]?.B && jsonData[i]?.H && jsonData[i]?.Q) {
            constructObj = {
                id: i,
                dataCumparare: jsonData[i].B || '',
                tip: jsonData[i].H || '',
                valoare: jsonData[i].Q || '',
                terminal: jsonData[i + 2].H || ''
            }

            groupedValues.push(constructObj);
        }
    }


    let grupedDataArray: any = {};
    groupedValues.forEach((row, index: number) => {
        if (grupedDataArray[row.terminal]) {
            let newRows = grupedDataArray[row.terminal].rows;
            grupedDataArray = { ...grupedDataArray, [row.terminal]: { rows: [...newRows, row], id: index, tag: ['General'], total: 0 } }
        } else {
            grupedDataArray = { ...grupedDataArray, [row.terminal]: { rows: [row], id: index, tag: ['General'], total: 0 } }
        }

        //Make total if rows was created and sorted
        if (grupedDataArray[row.terminal].rows) {
            let total = grupedDataArray[row.terminal].rows.reduce(
                (acumulator: any, currentValue: any) => {
                    return acumulator + parseFloat(currentValue.valoare);
                }, 0)
            grupedDataArray[row.terminal].total = total
        }
    })

    let grupByLabels: any = [];
    tags.forEach((tag: any) => {
        for (let merchant in grupedDataArray) {
            if (grupedDataArray[merchant].tag.indexOf(tag.name) !== -1) {
                grupByLabels.push(grupedDataArray[merchant]);
            }
        }
    })

    
    res.json({ grupByLabels, grupByMerchant: grupedDataArray });
});


app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

