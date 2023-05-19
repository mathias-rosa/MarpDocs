import { convert } from "./core.js";
import fs from "fs";
import puppeteer from "puppeteer";

const args = process.argv.slice(2);
let input = "";
let output = "";
let theme = "";
let fileFormat = "pdf";
let lang = Intl.DateTimeFormat().resolvedOptions().locale;

function help() {
    console.log("Usage: matmarp [options] <markdown>");
    console.log("");
    console.log("Options:");
    console.log("  -h, --help     Show usage");
    console.log("  -i, --input    Input file path (Required)");
    console.log(
        "  -o, --output   Output file path (default : match input file name))))"
    );
    console.log("  -t, --theme    Theme file path (optional)");
    console.log("  --lang         Language (default : system language)");
    console.log("  --html         Convert to HTML");
}

function getTheme(filename) {
    let theme = "";
    // If it's a default theme, use it.
    if (["gaia", "default", "uncover"].includes(filename)) {
        theme = `
        /*
             @theme inherited${filename}
             @auto-scaling true
         */
            @import-theme '${filename}';
        `;
    }
    // check if it's a file in the themes directory
    else if (fs.existsSync(`./themes/${filename}.css`)) {
        theme = fs.readFileSync(`./themes/${filename}.css`, "utf-8");
    }
    // check if it's a path to a css file
    else if (fs.existsSync(filename)) {
        theme = fs.readFileSync(filename, "utf-8");
    } else {
        console.error(`Theme file ${filename} not found.`);
        process.exit(1);
    }

    return theme;
}

async function toPdf(output, outputFile) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(fs.realpathSync(output + ".html"));

    await page.waitForSelector("img");
    // Capture la page au format PDF
    await page.pdf({ path: output + ".pdf", preferCSSPageSize: true });

    await browser.close();
}

if (args.length === 0) {
    console.error("Please specify Markdown file path.");
    process.exit(1);
}
args.forEach((arg, i) => {
    if (i + 1 >= args.length && !["-h", "--help", "--html"].includes(arg)) {
        console.error("Missing argument for option " + arg + ".");
        return;
    }
    switch (arg) {
        case "-h":
        case "--help":
            help();
            break;
        case "-i":
        case "--input":
            input = args[i + 1];
            break;
        case "-o":
        case "--output":
            output = args[i + 1];
            break;
        case "-t":
        case "--theme":
            theme = getTheme(args[i + 1]);
            break;
        case "--lang":
            lang = args[i + 1];
            break;
        case "--html":
            fileFormat = "html";
            console.log(fileFormat);
            break;
    }
});

if (input === "") {
    console.error("Please specify Markdown file path.");
    process.exit(1);
}

const inputFile = fs.readFileSync(input, "utf-8");

const outputFile = convert(inputFile, theme, lang.split("-")[0]);

if (output === "") {
    output = input.replace(/\.md$/, "");
}

console.log(`Writing to ${output}.${fileFormat}`);

if (fileFormat === "pdf") {
    fs.writeFileSync(output + ".html", outputFile.trim(), "utf-8");
    toPdf(output, outputFile.trim());
} else if (fileFormat === "html") {
    output += ".html";
    fs.writeFileSync(output, outputFile.trim(), "utf-8");
}
