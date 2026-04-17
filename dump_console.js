import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}:`, msg.text());
        });
        
        page.on('pageerror', error => {
            console.log('[BROWSER PAGE ERROR]', error.message);
        });
        
        page.on('requestfailed', request => {
            console.log(`[NETWORK FAILED] ${request.url()} - ${request.failure()?.errorText || 'Unknown'}`);
        });

        console.log('Navigating to localhost...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        console.log('Evaluating root...');
        const html = await page.$eval('#root', el => el.innerHTML).catch(e => `Error getting root: ${e.message}`);
        console.log('ROOT HTML LENGTH:', html.length);
        console.log('ROOT HTML PREVIEW:', html.substring(0, 200));
        
        await browser.close();
        console.log('Done.');
    } catch (e) {
        console.error('Script Failed:', e);
    }
})();
