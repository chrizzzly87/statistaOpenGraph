/* Open Graph Server */
const express = require('express');
const app = express();
// const compression = require('compression');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const hbs = require("handlebars");

const PORT = process.env.PORT || 1987;

// app.use(express.compress());
// app.use(compression());

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res, next) => {
    res.sendFile(path.join(__dirname + `/index.html`));
});

const EXPORT_DESTINATION = './export';
const WIDTH = 1200;
const HEIGHT = 600;


app.get("/job", async (req, res, next) => {
    console.time("OGJob");
    // Use query params and defaults
    let title = req.query.title || '';
    let location = req.query.location || 'Remote';
    let time = req.query.time || 'Fulltime';
    let type = req.query.type || 'Permanent';
    let id = req.query.id || 0;
    let filename = `temp_job${ id }.png`;
    let force = req.query.force || 'false';
    let file = await fs.existsSync(filename);

    const lastSavedThreshold = 3 * 24 * 60 * 60; // three days
    // check if file exists, and if so, if it's not older than x days
    if (force === 'false' && file) {
        try {
            const stats = fs.statSync(filename);
            let modifiedDate = new Date(stats.mtime);
            let now = new Date();

            if (now.getTime() - modifiedDate.getTime() < lastSavedThreshold) {
                // return the old image
                console.log('Return old image (newer than 3 days)');
                console.timeEnd("OGJob");
                res.sendFile(path.join(__dirname + `/${ filename }`));

                return;
            }
        } catch (err) {
            console.error(err);
        }
    }

    const content = await compile('job', {
        title, location, time, type
    });
    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--font-render-hinting=none",
                "--force-color-profile=srgb",
            ],
            headless: true,
        })
        //const context = await browser.createIncognitoBrowserContext();
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36");
        await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1});
        await page.goto(`data: text/html;charset=UTF-8, ${ content }`, { 
            waitUntil: "domcontentloaded" 
        });
        await page.setContent(content);

        const image = await page.screenshot({ 
            path: filename, 
            type: 'png',
            fullPage: false,
        });

        await page.close();
        console.log('Screenshot done');
        // return image;
    } catch(err) {
        console.log(err);
    } finally {
        await browser.close();
        console.log('Image created');
        console.timeEnd("OGJob");
        res.sendFile(path.join(__dirname + `/${ filename }`));
    }
});

app.get("/topic", async (req, res, next) => {
    console.time("OGTopic");

  
    // Use query params and defaults
    let id = req.query.id || '0';
    let title = req.query.title || '';
    let description = req.query.description || 'description';
    let force = req.query.force || 'false';
    let filename = `temp_topic${ id }.png`;
    let file = await fs.existsSync(filename);

    const lastSavedThreshold = 3 * 24 * 60 * 60; // three days
    // check if file exists, and if so, if it's not older than x days
    if (force === 'false' && file) {
        try {
            const stats = fs.statSync(filename);
            let modifiedDate = new Date(stats.mtime);
            let now = new Date();

            if (now.getTime() - modifiedDate.getTime() < lastSavedThreshold) {
                // return the old image
                console.log('Return old image (newer than 3 days)');
                console.timeEnd("OGTopic");
                res.sendFile(path.join(__dirname + `/${ filename }`));

                return;
            }
            // print file last modified date
            console.log();
        } catch (err) {
            console.error(err);
        }
    }

    const content = await compile('topic', {
        title, description, id
    });
    let browser = null;
    try {
        console.log('Launching Puppeteer');
        browser = await puppeteer.launch({
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--font-render-hinting=none",
                "--force-color-profile=srgb",
            ],
            headless: true,
        })
        //const context = await browser.createIncognitoBrowserContext();
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36");
        await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1});
        await page.goto(`data: text/html;charset=UTF-8, ${ content }`, { 
            waitUntil: "domcontentloaded" 
        });
        await page.setContent(content);

        console.log('Screenshotting the layout');
        const image = await page.screenshot({ 
            path: filename, 
            type: 'png',
            fullPage: false,
        });

        await page.close();
        console.log('Screenshot done');
        // return image;
    } catch(err) {
        console.log(err);
    } finally {
        await browser.close();
        console.log('Image created');
        console.timeEnd("OGTopic");
        res.sendFile(path.join(__dirname + `/${ filename }`));
    }
});

