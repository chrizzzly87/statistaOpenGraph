/* Open Graph Server - Studies */
const express = require('express');
const app = express();
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

const PORT = process.env.PORT || 1987;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.get('/', (req, res, next) => {
    res.send(`Running study.js`);
});

const EXPORT_DESTINATION = './export';
const EXPORT_FORMAT = 'png';
const BACKGROUND = 'study_blank.png';

const FONT_STYLE_TITLE = '900 72px Open Sans';
const FONT_STYLE_TYPE = '500 24px Open Sans';

const CACHE_TIME = 24 * 60 * 60 * 1000; // 1 day in MS
// const CACHE_TIME = 1; // 1ms for debugging

app.get("/og/study", async (req, res, next) => {
    // Use query params and defaults or send error msg
    let title = req.query.title ? req.query.title : res.send({status: 'error', response: 'Missing title'});
    let id  = req.query.id ? req.query.id : res.send({status: 'error', response: 'Missing id'});
    let type = req.query.type ? req.query.type.toUpperCase() : '';
    let resizeWidth = req.query.width ? req.query.width : false;
    let forceNewImage = req.query.force ? req.query.force : false;

    const width = 1200;
    const height = 630;

    const filename = `og_study_${id}.${EXPORT_FORMAT}`;
    const totalPath = `${EXPORT_DESTINATION}/${filename}`;
    const absolutePath = path.join(__dirname, totalPath);

    // Check if an image already exists which is not older than cache time
    if (fs.existsSync(absolutePath)) {
        const checkFile = await fs.statSync(absolutePath);
        if (checkFile) {
            const lastModified = checkFile.mtimeMs;
            const now = Date.now();
            if (now <= (lastModified + CACHE_TIME) && !forceNewImage) {
                console.log('Returning cached image on server');
                res.sendFile(absolutePath);
                return null;
            }
        }
    }


    // Create canvas and declare 2d context
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    // Draw Background Fill
    context.fillStyle = '#0f2741';
    context.fillRect(0, 0, width, height);

    // Draw Background Image
    let bg = await loadImage(`./backgrounds/${BACKGROUND}`);
    context.drawImage(bg, 0, 0, bg.width, bg.height);

    // Render Position
    // Size needs to be converted since Photoshop is a bitch.. 60pt in photoshop 
    context.font = FONT_STYLE_TITLE;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#fff';
    
    // Render Title
    // Position vertically centered
    let boundingBox = getWrappedTextDimensions(context, title, 870, 90);
    let positionTextY = (height - boundingBox.height) / 2; // vertical center
    wrapText(context, title, 80, positionTextY, 870, 90);


    // TO-DO
    // Render URL


    // Render Type

    // Load Canvas onto Buffer for exporting
    const buffer = canvas.toBuffer('image/png');

    // check for resize options

    // Create PNG
    if (resizeWidth) {
        await sharp(buffer)
            .png()
            .resize({width: +resizeWidth}) // + converts strings to int
            .toFile(totalPath);
        console.log(`Resized file created (${resizeWidth} width): ${filename}`);
    } else {
        await sharp(buffer)
            .png()
            .toFile(totalPath);
        console.log('File created: ' + filename);
    }

    res.sendFile(absolutePath);
});

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var cars = text.split("\n");

    for (var ii = 0; ii < cars.length; ii++) {

        var line = "";
        var words = cars[ii].split(' ');

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + " ";
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;

            if (testWidth > maxWidth) {
                context.fillText(line, x, y);
                line = words[n] + " ";
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }

        context.fillText(line, x, y);
        y += lineHeight;
    }
}


function getWrappedTextDimensions(context, text, maxWidth, lineHeight) {
    let characters = text.split("\n");
    let y = 0;
    for (let ii = 0; ii < characters.length; ii++) {

        let line = '';
        let words = characters[ii].split(' ');

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;

            if (testWidth > maxWidth) {
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }

        y += lineHeight;
    }

    return {
        width: maxWidth,
        height: y
    }
}

function textCanvas(text, x, y, maxWidth, lineHeight, options) {
    let canvas = createCanvas(maxWidth, 10000);
    let context = canvas.getContext('2d');
    // context = {...context, ...options};
    // console.log(context);
    context.font = 'italic 400 60px Playfair Display';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3085e5';

    var cars = text.split("\n");
    let totalHeight = 0;
    let startY = y;
    let totalLines = 1;

    for (var ii = 0; ii < cars.length; ii++) {

        var line = "";
        var words = cars[ii].split(' ');

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + " ";
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;

            if (testWidth > maxWidth) {
                context.fillText(line, x, y);
                line = words[n] + " ";
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }

        context.fillText(line, x, y);
        y += lineHeight;
    }
    totalHeight = y - startY;
    console.log(totalHeight);

    return {
        context: context,
        width: maxWidth,
        height: totalHeight,
    }
}