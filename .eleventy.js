const yaml = require("js-yaml");

module.exports = function (eleventyConfig) {
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");

  eleventyConfig.addFilter("findByType", function (list, type) {
    return (list || []).find((item) => item.type === type);
  });

  eleventyConfig.addFilter("availableBeds", function (beds) {
    return (beds || []).filter((bed) => !bed.occupied).length;
  });

  eleventyConfig.addFilter("vacantBedLabels", function (beds) {
    return (beds || []).filter((bed) => !bed.occupied).map((bed) => bed.label).join("、");
  });

  eleventyConfig.addFilter("vacantBedLabelsByGender", function (beds, gender) {
    return (beds || []).filter((bed) => !bed.occupied && bed.gender === gender).map((bed) => bed.label).join("、");
  });

  eleventyConfig.addFilter("vacantBedLabelsNoGender", function (beds) {
    return (beds || []).filter((bed) => !bed.occupied && !bed.gender).map((bed) => bed.label).join("、");
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
