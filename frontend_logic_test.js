const fs = require("fs");

const script = fs.readFileSync("script.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const results = [];

const check = (name, pass, details = "") => {
  results.push({ name, pass, details });
};

check(
  "Rent navbar link routes to #/properties?type=rent",
  html.includes('href="#/properties?type=rent"'),
  "index.html nav rent href check"
);

check(
  "Route handles #/properties and query parsing for type filter",
  /const\s+hash\s*=\s*location\.hash\s*\|\|\s*"#\/properties"/.test(script) &&
    /const\s+queryString\s*=\s*hash\.includes\("\?"\)\s*\?\s*hash\.split\("\?"\)\[1\]\s*:\s*""/.test(script) &&
    /const\s+type\s*=\s*params\.get\("type"\)/.test(script),
  "loadAllPropertiesPage query parsing"
);

check(
  "Only buy/rent values are accepted for type filtering",
  /\["buy",\s*"rent"\]\.includes\(type\.toLowerCase\(\)\)/.test(script),
  "type whitelist check"
);

check(
  "Properties API is called with type query when present",
  /const\s+endpoint\s*=\s*query\.toString\(\)\s*\?\s*`\/properties\?\$\{query\.toString\(\)\}`\s*:\s*"\/properties"/.test(script),
  "endpoint build for list filter"
);

check(
  "Property cards render Contact Owner button only when owner.email exists",
  /property\?\.\s*owner\?\.\s*email[\s\S]*\? `?<button class="btn btn-primary" data-contact-email="\$\{property\.owner\.email\}">Contact Owner<\/button>`?[\s\S]*: ""/.test(script),
  "conditional button render in allPropertiesCardTemplate"
);

check(
  "Card Contact Owner click opens mailto:owner.email",
  /querySelectorAll\("\[data-contact-email\]"\)[\s\S]*window\.location\.href\s*=\s*`mailto:\$\{email\}`/.test(script),
  "card contact click handler"
);

check(
  "Property details renders Owner Information section",
  /<div class="owner-contact">[\s\S]*<h3>Owner Information<\/h3>/.test(script),
  "details owner section heading"
);

check(
  "Property details show owner name and email from backend response",
  /Posted by: \$\{property\.owner\?\.\s*name \|\| "Owner"\}/.test(script) &&
    /Email: \$\{property\.owner\?\.\s*email \|\| "Not available"\}/.test(script),
  "details owner fields"
);

check(
  "Details Contact Owner button is conditional on owner.email",
  /property\?\.\s*owner\?\.\s*email[\s\S]*id="contactOwnerBtn"/.test(script),
  "details conditional contact button"
);

check(
  "Details Contact Owner click opens mailto:owner.email",
  /contactOwnerBtn[\s\S]*window\.location\.href\s*=\s*`mailto:\$\{property\.owner\.email\}`/.test(script),
  "details contact click handler"
);

check(
  "Contact button uses primary button class for UI consistency",
  script.includes('class="btn btn-primary" data-contact-email=') &&
    script.includes('class="btn btn-primary" id="contactOwnerBtn"'),
  "primary button class usage"
);

check(
  "Owner email source is backend response object only (no owner email form input)",
  !/ownerEmailInput|contactEmailInput|emailOwnerInput/.test(script),
  "no client owner-email input source"
);

check(
  "Owner contact CSS section exists",
  /\.owner-contact\s*\{/.test(css) && /\.owner-contact h3\s*\{/.test(css),
  "style.css owner-contact rules"
);

const failed = results.filter((r) => !r.pass);

console.log("=== Frontend Logic Verification ===");
for (const r of results) {
  console.log(`[${r.pass ? "PASS" : "FAIL"}] ${r.name}${r.details ? ` -> ${r.details}` : ""}`);
}
console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`);

if (failed.length) {
  process.exitCode = 1;
}
