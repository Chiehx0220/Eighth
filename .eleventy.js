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

  eleventyConfig.addFilter("availableBeds", function (beds) {
    return (beds || []).filter((bed) => !bed.occupied).length;
  });

  eleventyConfig.addFilter("vacantBedLabels", function (beds) {
    return (beds || []).filter((bed) => !bed.occupied).map((bed) => bed.label).join("、");
  });

  function roomBeds(room) {
    const beds = [];
    let i = 1;
    while (room[`bed${i}_label`] !== undefined) {
      beds.push({ label: room[`bed${i}_label`], occupied: !!room[`bed${i}_occupied`] });
      i++;
    }
    return beds;
  }

  eleventyConfig.addFilter("flattenRoomBeds", function (rooms) {
    return (rooms || []).flatMap((room) => roomBeds(room));
  });

  eleventyConfig.addFilter("vacantBedLabelsByRoomGender", function (rooms, gender) {
    return (rooms || [])
      .filter((room) => room.gender === gender)
      .flatMap((room) => roomBeds(room).filter((bed) => !bed.occupied).map((bed) => bed.label))
      .join("、");
  });

  eleventyConfig.addFilter("vacantBedLabelsRoomsNoGenderOccupied", function (rooms) {
    return (rooms || [])
      .filter((room) => !room.gender && roomBeds(room).some((bed) => bed.occupied))
      .flatMap((room) => roomBeds(room).filter((bed) => !bed.occupied).map((bed) => bed.label))
      .join("、");
  });

  eleventyConfig.addFilter("vacantBedLabelsRoomsEmpty", function (rooms) {
    return (rooms || [])
      .filter((room) => !room.gender && !roomBeds(room).some((bed) => bed.occupied))
      .flatMap((room) => roomBeds(room).map((bed) => bed.label))
      .join("、");
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
