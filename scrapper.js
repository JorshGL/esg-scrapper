const puppeteer = require("puppeteer");
const esgData = require("./esg-scores.json");
const fs = require("fs/promises");

const getEsgScore = async (company) => {
  const esgScore = esgData.find((c) =>
    c.company_name?.toLowerCase().includes(company?.toLowerCase())
  );
  if (esgScore) {
    const { total, environment_score, social_score, governance_score } =
      esgScore;
    return { total, environment_score, social_score, governance_score };
  }

  const apiKey = "63e8a1a2f70c2b11fedb599ffce8831b";

  const response = await fetch(
    `https://esgapiservice.com/api/authorization/search?token=${apiKey}&q=${company}`
  );
  const data = await response.json();
  if (response.status !== 200) return;

  await fs.writeFile(
    "./esg-scores.json",
    JSON.stringify([...esgData, data], null, 2)
  );
  if (data.length > 0) {
    const { total, environment_score, social_score, governance_score } =
      data[0];
    return { total, environment_score, social_score, governance_score };
  }
};

const getProducts = async (searchString) => {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
  });
  const page = await browser.newPage();
  const searchUrl = `https://www.exito.com/${searchString}?_q=${searchString}&map=ft`;
  await page.goto(searchUrl);
  await page.waitForSelector(".exito-vtex-components-4-x-PricePDP");

  const data = await page.evaluate(() => {
    const grid = document.getElementById("gallery-layout-container");
    const products = Array.from(grid.querySelectorAll("section"));
    return products.map((p) => {
      const name = p?.querySelector("h3")?.querySelector("span")?.innerText;
      const url = p?.querySelector("a")?.href;
      const brand = p?.querySelector(
        "span.vtex-product-summary-2-x-productBrandName"
      )?.innerText;
      const price = p
        ?.querySelector("div.exito-vtex-components-4-x-PricePDP")
        ?.querySelector("span")?.innerText;

      return { name, url, brand, price };
    });
  });

  await browser.close();

  return Promise.all(
    data.map(async (p) => ({
      ...p,
      esgScore: await getEsgScore(p.brand),
    }))
  );
};

module.exports = {
  getProducts,
};
