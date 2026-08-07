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

  eleventyConfig.addFilter("flattenRoomBeds", function (rooms) {
    return (rooms || []).flatMap((room) => room.beds || []);
  });

  eleventyConfig.addFilter("vacantBedLabelsByRoomGender", function (rooms, gender) {
    return (rooms || [])
      .filter((room) => room.gender === gender)
      .flatMap((room) => (room.beds || []).filter((bed) => !bed.occupied).map((bed) => bed.label))
      .join("、");
  });

  eleventyConfig.addFilter("vacantBedLabelsRoomsNoGender", function (rooms) {
    return (rooms || [])
      .filter((room) => !room.gender)
      .flatMap((room) => (room.beds || []).filter((bed) => !bed.occupied).map((bed) => bed.label))
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
