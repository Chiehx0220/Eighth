const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const CleanCSS = require("clean-css");
const { minify: minifyJs } = require("terser");
const { minify: minifyHtml } = require("html-minifier-terser");

const isBuild = process.env.ELEVENTY_RUN_MODE === "build";

module.exports = function (eleventyConfig) {
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");

  if (isBuild) {
    eleventyConfig.addTransform("htmlmin", async function (content) {
      if (!this.page.outputPath || !this.page.outputPath.endsWith(".html")) {
        return content;
      }
      return minifyHtml(content, {
        collapseWhitespace: true,
        removeComments: true,
        collapseBooleanAttributes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true
      });
    });

    eleventyConfig.on("eleventy.after", async ({ dir }) => {
      const cssPath = path.join(dir.output, "assets/css/style.css");
      if (fs.existsSync(cssPath)) {
        const output = new CleanCSS().minify(fs.readFileSync(cssPath, "utf8"));
        fs.writeFileSync(cssPath, output.styles);
      }

      const jsPath = path.join(dir.output, "assets/js/main.js");
      if (fs.existsSync(jsPath)) {
        const result = await minifyJs(fs.readFileSync(jsPath, "utf8"));
        fs.writeFileSync(jsPath, result.code);
      }
    });
  }

  eleventyConfig.addFilter("findByType", function (list, type) {
    return (list || []).find((item) => item.type === type);
  });

  eleventyConfig.addFilter("pluckLabel", function (beds) {
    return (beds || []).map((bed) => bed.label);
  });

  eleventyConfig.addFilter("pluckRoom", function (rooms) {
    return (rooms || []).map((room) => room.room);
  });

  eleventyConfig.addFilter("availableBeds", function (beds) {
    return (beds || []).filter((bed) => !bed.occupied).length;
  });

  // Bed numbers skip 4 (unlucky number convention): a room's 4th bed is
  // labeled "-5", not "-4". Bed labels are derived from the room number
  // instead of being entered manually in the CMS.
  function bedNumber(i) {
    return i >= 4 ? i + 1 : i;
  }

  function roomBeds(room) {
    const beds = [];
    let i = 1;
    while (room[`bed${i}_occupied`] !== undefined) {
      beds.push({ label: `${room.room}-${bedNumber(i)}`, occupied: !!room[`bed${i}_occupied`] });
      i++;
    }
    return beds;
  }

  eleventyConfig.addFilter("flattenRoomBeds", function (rooms) {
    return (rooms || []).flatMap((room) => roomBeds(room));
  });

  // Room-upgrade applications ask for the patient's *current* bed, so the
  // picker excludes beds belonging to the room type being applied for.
  eleventyConfig.addFilter("bedLabelsExcluding", function (roomsData, excludeType) {
    const groups = [
      { type: "單人房", beds: (roomsData.single_room_beds || []).map((bed) => bed.label) },
      { type: "雙人房", beds: (roomsData.double_room_beds || []).flatMap((room) => roomBeds(room)).map((bed) => bed.label) },
      { type: "健保四人房", beds: (roomsData.insured_quad_room_beds || []).flatMap((room) => roomBeds(room)).map((bed) => bed.label) },
      { type: "健保雙人房", beds: (roomsData.insured_double_room_beds || []).flatMap((room) => roomBeds(room)).map((bed) => bed.label) },
    ];
    return groups.filter((group) => group.type !== excludeType).flatMap((group) => group.beds);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
