import { Marp } from "@marp-team/marp-core";
import anchor from "markdown-it-anchor";
import tableOfContents from "markdown-it-table-of-contents";

function convert(file, theme = "") {
    const marp = new Marp({
        // marp-core constructor options
        markdown: {
            html: true, // Enable HTML tags
            breaks: true, // Convert line breaks into `<br />`
        },
        math: "mathjax",
    })
        .use(anchor)
        .use(tableOfContents, { includeLevel: [2, 3, 4], listType: "ol" });

    if (theme !== "") {
        marp.themeSet.default = marp.themeSet.add(theme);
    }

    const { html, css } = marp.render(file);
    const htmlFile = `
        <!DOCTYPE html>
        <html><body>
        <style>${css}</style>
        ${html}
        </body></html>
    `;
    return htmlFile;
}

export { convert };
