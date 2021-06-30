const sheetFormat = {
  a0: {
    width: 841,
    height: 1189,
  },
  a1: {
    width: 594,
    height: 841,
  },
  a2: {
    width: 420,
    height: 594,
  },
  a3: {
    width: 297,
    height: 420,
  },
  a4: {
    width: 210,
    height: 297,
  },
  a5: {
    width: 148,
    height: 210,
  },
  a6: {
    width: 105,
    height: 148,
  },
};

const range = (n) => [...Array(n).keys()];

function getColumns(width, cardWidth) {
  const minimalMargin = 10;
  const pageWidth = width - minimalMargin * 2;
  const columns = Math.floor(pageWidth / cardWidth);
  return columns;
}

function getRows(height, cardHeight) {
  const minimalMargin = 10;
  const pageHeight = height - minimalMargin * 2;
  const rows = Math.floor(pageHeight / cardHeight);
  return rows;
}

const getCardPositions = (
  deckSize,
  cardWidth,
  cardHeight,
  columns,
  rows,
  gutter
) => {
  const cells = columns * rows;
  return range(deckSize).map((i) => {
    const local = i % cells;
    return {
      x: cardWidth * (local % columns) + gutter * (local % columns),
      y:
        cardHeight * Math.floor(local / rows) +
        gutter * Math.floor(local / rows),
      isLast: local === cells - 1,
    };
  });
};

function getGutter(gutterClass) {
  if (gutterClass === "smallGutter") {
    return 1;
  }
  if (gutterClass === "tinyGutter") {
    return 0.5;
  }
  return 0;
}

// function getCardSize(sizeClass) {
//   if (sizeClass === "tinySize") {
//     return {
//       width: 38,
//       height: 53,
//       name: "38x53",
//     };
//   }
//   if (sizeClass === "smallSize") {
//     return {
//       width: 56,
//       height: 78,
//       name: "56x78",
//     };
//   }
//   return {
//     width: 63,
//     height: 88,
//     name: "Std Card USA Game",
//   };
// }

function getCardSize(scale) {
    return {
      width: scaleWidth(scale),
      height: scaleHeight(scale),
      name:
        scale != 100
          ? `Std Card USA Game scaled at ${scale}%`
          : "Std Card USA Game",
    };
  }

const buildPdfName = (deckSize, cardName) =>
  `InkfathomProxy-${deckSize}_${cardName.replace(" ", "_")}.pdf`;

function getFilenameFromUrl(url) {
  const pathname = new URL(url).pathname;
  const index = pathname.lastIndexOf("/");
  return -1 !== index ? pathname.substring(index + 1) : pathname;
}
