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
