import puppeteer from "puppeteer";
import jsQR from "jsqr";
import qrcode from "qrcode-terminal";

(async function decodeQrFromIframe() {
    let browser = null;
    const startTimestamp = Date.now();
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const DOM_CONTENT_LOAD_TIMEOUT = 20_000;
        const MAIN_FRAME_SELECTOR_TIMEOUT = 10_000;
        const SUB_FRAME_SELECTOR_TIMEOUT = 15_000;

        const page = await browser.newPage();
        console.log("opened browser.");
        await page.setViewport({ width: 1200, height: 800 });
        // TODO: .env
        await page.goto("your devops domain", {
            waitUntil: "domcontentloaded",
            timeout: DOM_CONTENT_LOAD_TIMEOUT,
        });
        console.log("loaded document.");

        const accountTypesWrapperSelector = "[class^=\"tab-container\"]";
        const accountTypesWrapper = await page.waitForSelector(accountTypesWrapperSelector, {
            timeout: MAIN_FRAME_SELECTOR_TIMEOUT,
        });
        if (!accountTypesWrapper)
            throw new Error("No accountTypes found.");
        const accountTypes = await accountTypesWrapper.$$("dd");
        console.log("account types: ", accountTypes.length);
        await accountTypes[1].click();

        const otherWaysWrapperSelector = "[class^=\"other-ways\"]";
        const otherWaysWrapper = await page.waitForSelector(otherWaysWrapperSelector);
        if (!otherWaysWrapper)
            throw new Error("No otherWays found.");
        const otherWays = await otherWaysWrapper.$$(" [class^=\"inline-container\"]");
        console.log("other ways: ", otherWays.length);

        const frame = await page.waitForFrame(
            frame => frame.url().includes("qrconnect") || frame.url().includes("qrcode"),
            { timeout: SUB_FRAME_SELECTOR_TIMEOUT, },
        );
        if (!frame) throw new Error("未找到二维码所在iframe");

        const qrImgSelector = ".qrcode";
        await frame.waitForSelector(qrImgSelector, {
            timeout: 15000,
            visible: true
        });

        const pixelData = await frame.evaluate((selector) => {
            const img = document.querySelector(selector);
            if (!img) return null;

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;

            return new Promise((resolve) => {
                const imgObj = new Image();
                imgObj.crossOrigin = "anonymous";
                imgObj.onload = () => {
                    ctx.drawImage(imgObj, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    resolve({
                        data: Array.from(imageData.data), // 转数组方便传递
                        width: canvas.width,
                        height: canvas.height
                    });
                };
                // 处理加载失败
                imgObj.onerror = () => resolve(null);
                imgObj.src = img.src;
            });
        }, qrImgSelector);

        if (!pixelData || !pixelData.data) throw new Error("未获取到二维码像素数据");

        const uint8Array = new Uint8Array(pixelData.data);
        const qrResult = jsQR(uint8Array, pixelData.width, pixelData.height);

        if (qrResult) {
            qrcode.generate(qrResult.data, { small: true });

            page.on("framenavigated", async (frame) => {
                if (frame !== page.mainFrame()) return;

                const currentUrl = frame.url();
                if (currentUrl.includes("/workbench")) {
                    const workbenchCookies = await page.cookies();
                    console.log("工作台Cookies：", workbenchCookies);
                }
            });

            await page.waitForNavigation({
                waitUntil: "networkidle2",
                timeout: 0
            });

            // 导航完成后二次确认获取Cookies（兜底）
            const cookies = await browser.cookies();
            if (!cookies)
                throw new Error("Cookie not found.");
            console.log("跳转完成后最终Cookies：", cookies.map(item => item.name).join(", "));
        } else {
            throw new Error("二维码解码失败（无有效数据）");
        }

    } catch (error) {
        console.error("❌ 执行失败：", error.message);
    } finally {
        if (browser) await browser.close();
        console.log(`Done in ${((Date.now() - startTimestamp) / 1_000).toFixed(2)}s`);
    }
})();
