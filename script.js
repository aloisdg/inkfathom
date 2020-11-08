let deckElement = document.querySelector(".deck");
const baseUrl = "https://api.scryfall.com/cards/search?q=";
const cardPath = "name=";
const tokenPath = "t:token%20name=";

const getCardUrl = (cardName, set) =>
  `${baseUrl}${cardPath}${encodeURI(cardName)}${!!set ? `%20set:${set}` : ""}`;
const getTokenUrl = (cardName, set) =>
  `${baseUrl}${tokenPath}${encodeURI(cardName)}${
    !!set ? `%20set:${set.length === 3 ? "t" : ""}${set}` : ""
  }`;

function extracts(input, from, to) {
  const start = input.indexOf(from) + from.length;
  const distance = input.lastIndexOf(to) - start;
  return input.substr(start, distance);
}

function indexOfNaN(input) {
  let i = 0;
  for (; input[i] >= "0" && input[i] <= "9"; i++);
  return i;
}

function cleanStars(input) {
  return input.replace(/ \*([^*]+)\*/g, "");
}

function parseContext(contextWithStars) {
  const context = cleanStars(contextWithStars); // todo: No foil, alter, language nor condition
  const number = context.substr(0, indexOfNaN(context));
  const quantity = number === "" ? 1 : parseInt(number);
  var start = number === "" ? 0 : context.indexOf(" ") + 1;
  var distance =
    (context.includes(" (") ? context.indexOf(" (") : context.length) - start;
  const name = context.substr(start, distance);
  const set = extracts(context, "(", ")");

  return {
    name: name,
    quantity: quantity,
    set: set,
  };
}

function getNextEdition(editions) {
  let i = 0;
  for (; i < editions.length && editions[i].image_url.endsWith("/0.jpg"); i++);
  return editions[i];
}

function buildCardDataset(cardData, printsSearchUri, set, face = null) {
  return {
    custom: false,
    isBasicLand: cardData.type_line.startsWith("Basic Land"),
    name: cardData.name,
    cost: cardData.mana_cost,
    loyalty: cardData.loyalty,
    power: cardData.power,
    toughness: cardData.toughness,
    source: cardData.image_uris.large,
    set: set,
    printsUri: printsSearchUri,
    face: face,
  };
}

function getCardImageUrls(data, name) {
  if (name.includes("lang:")) {
    name = name.substring(0, name.indexOf("lang:") - 1);
  }

  const cardData = data.data.filter(
    (x) => (x.printed_name ?? x.name).toUpperCase() === name.toUpperCase()
  )[0];

  if (cardData.card_faces && cardData.card_faces[0].image_uris)
    return [
      buildCardDataset(
        cardData.card_faces[0],
        cardData.prints_search_uri,
        cardData.set,
        0
      ),
      buildCardDataset(
        cardData.card_faces[1],
        cardData.prints_search_uri,
        cardData.set,
        1
      ),
    ];
  return [buildCardDataset(cardData, cardData.prints_search_uri, cardData.set)];
}

function getTokenImageUrls(data, name) {
  const cardData = data.data.filter((x) => x.name === name)[0];
  if (cardData.name === undefined) return [];
  if (cardData.name === name && cardData.layout === "token")
    return [
      buildCardDataset(cardData, cardData.prints_search_uri, cardData.set),
    ];
  if (cardData.layout !== "double_faced_token") return [];
  const face = cardData.card_faces.find((f) => f.name === name);
  return face === undefined
    ? []
    : [buildCardDataset(face, face.prints_search_uri, face.set)];
}

function appendCards(sources, quantity, isCustom) {
  const proxyurl = "https://cors-anywhere.herokuapp.com/";
  sources.forEach((source) => {
    for (let i = 0; i < quantity; i++) {
      const div = document.createElement("div");
      div.classList.add(
        "flex",
        "relative",
        "noGutter",
        "normalSize",
        "justify-center",
        "align-center"
      );

      const loader = document.createElement("div");
      loader.classList.add("absolute", "z--1");
      loader.innerHTML = getLoaderHtml(80, 80);
      div.appendChild(loader);

      const img = document.createElement("img");
      const src = isCustom ? proxyurl + source.source : source.source;
      img.crossOrigin = "anonymous";
      img.setAttribute("src", src);
      img.classList.add("noGutter", "normalSize");
      img.dataset.src = src;
      img.dataset.custom = source.custom;
      if (!source.custom) {
        img.dataset.isBasicLand = source.isBasicLand;
        img.dataset.name = source.name;
        img.dataset.cost = source.cost;
        if (source.face !== null) img.dataset.face = source.face;
        if (source.printsUri) img.dataset.printsUri = source.printsUri;
        if (source.loyalty) img.dataset.loyalty = source.loyalty;
        if (source.power) img.dataset.power = source.power;
        if (source.toughness) img.dataset.toughness = source.toughness;
      }
      div.appendChild(img);

      if (!source.custom && source.printsUri) {
        const button = document.createElement("button");
        button.textContent = source.set;
        button.setAttribute("type", "button");
        button.classList.add("absolute", "b-2", "uppercase", "text-base");
        button.onclick = switchPrint;
        div.appendChild(button);
      }

      deckElement.appendChild(div);
    }
  });
}

function clean() {
  cleanChildren(document.querySelector("main"));
}

function isUrl(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

const notFoundBanner = document.querySelector(".error");
function appendToErrorList(cardName) {
  if (notFoundBanner.classList.contains("hidden")) {
    notFoundBanner.classList.remove("hidden");
  }
  const li = document.createElement("li");
  li.textContent = cardName;
  const ul = notFoundBanner.lastElementChild.lastElementChild;
  ul.appendChild(li);
}

function cleanChildren(parent) {
  while (parent.firstElementChild) {
    parent.removeChild(parent.firstElementChild);
  }
}

function cleanErrorList() {
  if (!notFoundBanner.classList.contains("hidden")) {
    notFoundBanner.classList.add("hidden");
  }
  cleanChildren(notFoundBanner.lastElementChild.lastElementChild);
}

const keywords = ["Deck", "Sideboard", "Maybeboard"];
function fill(value, isToken = false) {
  [...value.split("\n")]
    .filter((line) => !!line.trim() && !keywords.includes(line.trim()))
    .forEach((context) => {
      const card = parseContext(context);
      if (isUrl(card.name)) {
        appendCards(
          [{ source: card.name, custom: true, isBasicLand: false }],
          card.quantity,
          true
        );
        return;
      }
      const url = isToken
        ? getTokenUrl(card.name, card.set)
        : getCardUrl(card.name, card.set);
      fetch(url)
        .then((response) => response.json())
        .then((data) =>
          appendCards(
            isToken
              ? getTokenImageUrls(data, card.name)
              : getCardImageUrls(data, card.name, card.edition),
            card.quantity,
            false
          )
        )
        .catch((e) => {
          appendToErrorList(card.name);
          console.error(`Booo:\n ${e}`);
        });
    });
}

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

const { jsPDF } = window.jspdf;

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

function getFilenameFromUrl(url) {
  const pathname = new URL(url).pathname;
  const index = pathname.lastIndexOf("/");
  return -1 !== index ? pathname.substring(index + 1) : pathname;
}

const buildPdf = (
  base64Images,
  cardPositions,
  cardWidth,
  cardHeight,
  columns,
  rows,
  pageWidth,
  pageHeight,
  gutter
) => {
  let doc = new jsPDF("p", "mm", [pageHeight, pageWidth]);
  const marginLeft =
    (pageWidth - cardWidth * columns - gutter * (columns - 1)) / 2;
  const marginTop = (pageHeight - cardHeight * rows - gutter * (rows - 1)) / 2;
  cardPositions.forEach((position, i) => {
    const x = marginLeft + position.x;
    const y = marginTop + position.y;

    doc.addImage(base64Images[i], "JPEG", x, y, cardWidth, cardHeight);

    if (position.isLast && i < cardPositions.length - 1) {
      doc.addPage();
    }
  });

  if (document.querySelector(".decklist").value === "with") {
    const text = document
      .querySelector(".cards")
      .value.trim()
      .split("\n")
      .map((x) => {
        if (!x.includes("http")) return x;
        const url = x.substr(x.indexOf("http"));
        return isUrl(url)
          ? x.substr(0, x.indexOf("http")) + getFilenameFromUrl(url)
          : x;
      })
      .join("\n");
    doc.addPage();
    doc.setFontSize(22);
    // note: no token for now;
    doc.text(marginLeft, marginTop, text);
  }
  return doc;
};

function saveAspdf(doc, deckSize, cardName) {
  const name = `InkfathomProxy-${deckSize}_${cardName.replace(" ", "_")}.pdf`;
  doc.save(name);
}

function getGutter(gutterClass) {
  if (gutterClass === "smallGutter") {
    return 1;
  }
  if (gutterClass === "tinyGutter") {
    return 0.5;
  }
  return 0;
}

function getCardSize(sizeClass) {
  if (sizeClass === "tinySize") {
    return {
      width: 38,
      height: 53,
      name: "38x53",
    };
  }
  if (sizeClass === "smallSize") {
    return {
      width: 56,
      height: 78,
      name: "56x78",
    };
  }
  return {
    width: 63,
    height: 88,
    name: "Std Card USA Game",
  };
}

function print() {
  const imgs = document.querySelectorAll(".deck > div:not(.hidden) > img");
  const sheet =
    sheetFormat[document.querySelector(".sheet").value.toLowerCase()];
  const deckSize = imgs.length;

  const sizeClass = [...imgs[0].classList].filter((x) => x.includes("Size"))[0];
  const card = getCardSize(sizeClass);
  const columns = getColumns(sheet.width, card.width);
  const rows = getRows(sheet.height, card.height);
  const gutterClass = [...imgs[0].classList].filter((x) =>
    x.includes("Gutter")
  )[0];
  const gutter = getGutter(gutterClass);

  const base64Images = [...imgs].map((img) =>
    getBase64Image(img, card.width, card.height)
  );
  const cardPositions = getCardPositions(
    deckSize,
    card.width,
    card.height,
    columns,
    rows,
    gutter
  );
  const doc = buildPdf(
    base64Images,
    cardPositions,
    card.width,
    card.height,
    columns,
    rows,
    sheet.width,
    sheet.height,
    gutter
  );
  saveAspdf(doc, deckSize, card.name);
}

function getBase64Image(img, width, height) {
  const classes = img.className;
  img.className = "";
  var canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, img.width, img.height);
  var dataURL = canvas.toDataURL("image/jpg");
  img.className = classes;
  return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function renderDeck() {
  const cards = document.querySelector(".cards").value.trim();
  const tokens = document.querySelector("#extra_tokens").value.trim();
  if (cards === "" && tokens === "") return;

  clean();
  cleanErrorList();
  if (!!cards) fill(cards);
  if (!!tokens) fill(tokens, true);
}

document.querySelector(".print").onclick = function () {
  const value = document.querySelector(".cards").value.trim();
  if (value === "") return;
  print();
};

document.querySelector(".display").onclick = renderDeck;

function getLoaderHtml(width, height) {
  return `<div class="loader">
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     width="${width}px" height="${height}px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">
  <path fill="#fff" d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z">
    <animateTransform attributeType="xml"
      attributeName="transform"
      type="rotate"
      from="0 25 25"
      to="360 25 25"
      dur="0.6s"
      repeatCount="indefinite"/>
    </path>
  </svg>
  </div>`;
}

const formatSwitchButtonContent = (set, position, total) =>
  `${set} ${position}/${total}`;

function switchPrint(e) {
  const img = e.target.parentElement.children[1];
  if (img.dataset.totalCards === "1") {
    return;
  }
  e.target.setAttribute("disabled", true);
  e.target.innerHTML = getLoaderHtml(20, 20);

  if (!img.dataset.alternativePrints) {
    fetch(img.dataset.printsUri)
      .then((response) => response.json())
      .then((data) => {
        if (data.total_cards === 1) {
          img.dataset.totalCards = 1;
          e.target.removeAttribute("disabled");
          e.target.textContent = formatSwitchButtonContent(
            data.data[0].set,
            1,
            1
          );
          return;
        }

        const current = data.data.findIndex(
          (x) =>
            (img.dataset.face ? x.card_faces[+img.dataset.face] : x).image_uris
              .large === img.dataset.src
        );
        const next =
          data.data[current === data.data.length - 1 ? 0 : current + 1];
        img.dataset.alternativePrints = JSON.stringify(
          data.data.map((x) => ({
            source: (img.dataset.face ? x.card_faces[+img.dataset.face] : x)
              .image_uris.large,
            set: x.set,
          }))
        );
        img.onload = function () {
          e.target.textContent = formatSwitchButtonContent(
            next.set,
            current + 1,
            data.total_cards
          );
          e.target.removeAttribute("disabled");
        };
        img.dataset.src = (img.dataset.face
          ? next.card_faces[+img.dataset.face]
          : next
        ).image_uris.large;
        img.src = img.dataset.src;
      })
      .catch((e) => console.error(`Booo:\n ${e}`));
  } else {
    const prints = JSON.parse(img.dataset.alternativePrints);
    const current = prints.findIndex((print) => print.source === img.dataset.src);
    const next = prints[current === prints.length - 1 ? 0 : current + 1];
    img.onload = () => {
      e.target.textContent = formatSwitchButtonContent(
        next.set,
        current + 1,
        prints.length
      );
      e.target.removeAttribute("disabled");
    };
    img.dataset.src = next.source;
    img.src = img.dataset.src;
  }
}

document.querySelector(".gutter").onchange = function (e) {
  let imgs = document.querySelectorAll(".deck img");
  if (imgs.length == 0) return;
  const previous = e.target.dataset.gutter ?? "noGutter";
  imgs.forEach((img) => {
    img.classList.remove(previous);
    img.classList.add(e.target.value);
    img.parentElement.classList.remove(previous);
    img.parentElement.classList.add(e.target.value);
  });
  e.target.dataset.gutter = e.target.value;
};

document.querySelector(".size").onchange = function (e) {
  let imgs = document.querySelectorAll(".deck > div > img");
  if (imgs.length == 0) return;
  const previous = e.target.dataset.size ?? "normalSize";
  imgs.forEach((img) => {
    img.classList.remove(previous);
    img.classList.add(e.target.value);
    img.parentElement.classList.remove(previous);
    img.parentElement.classList.add(e.target.value);
  });
  e.target.dataset.size = e.target.value;
};

document.querySelector(".skipBasicLands").onchange = function (e) {
  let imgs = document.querySelectorAll(
    ".deck > div > img[data-is-basic-land='true']"
  );
  if (imgs.length == 0) return;
  const withBasicLands = e.target.value === "with";
  [...imgs].forEach((img) => {
    img.parentElement.classList.toggle("inline", withBasicLands);
    img.parentElement.classList.toggle("hidden", !withBasicLands);
  });
};

function drawTitle(ctx, lines) {
  ctx.font = "38px sans-serif";
  var x = 30;
  var y = 100;
  var lineHeight = 40;
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
}

function drawCmc(ctx, canvaswidth, cmc) {
  ctx.font = "26px mono";
  var x = 30;
  var y = 30;
  ctx.fillText(
    cmc.toUpperCase(),
    canvaswidth - ctx.measureText(cmc).width - x,
    y
  );
}

function drawBottomRight(ctx, canvasWidth, canvasHeight, value) {
  ctx.font = "26px mono";
  var x = 30;
  var y = 30;
  ctx.fillText(
    value,
    canvasWidth - ctx.measureText(value).width - x / 2,
    canvasHeight - y / 2
  );
}

function createCardAsText(cardName, cardCost, bottomValue) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = 63 * 4;
  canvas.height = 88 * 4;
  canvas.style.width = "63mm";
  canvas.style.height = "88mm";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(255,255,255)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(0,0,0)";

  const lines = cardName.split(" ");
  drawTitle(ctx, lines);
  drawCmc(ctx, canvas.width, cardCost);
  drawBottomRight(ctx, canvas.width, canvas.height, bottomValue);
  return canvas.toDataURL("image/jpeg", 1.0);
}

document.querySelector(".cardAs").onchange = function (e) {
  let imgs = document.querySelectorAll(".deck > div > img");
  if (imgs.length == 0) return;
  [...imgs]
    .filter((img) => img.dataset.custom === "false")
    .forEach((img) => {
      img.src =
        e.target.value === "image"
          ? img.dataset.src
          : createCardAsText(
              img.dataset.name,
              img.dataset.cost,
              img.dataset.loyalty ??
                (img.dataset.power && img.dataset.toughness
                  ? `${img.dataset.power} / ${img.dataset.toughness}`
                  : "")
            );
    });
};

function rotateContext(ctx, width, height) {
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI);
  ctx.translate(-width / 2, -height / 2);
}

function drawFront(
  img,
  canvas,
  ctx,
  width,
  height,
  source,
  buildPath,
  drawBack = null
) {
  const front = new Image();
  front.src = source;
  front.crossOrigin = "anonymous";
  front.onload = () => {
    ctx.save();
    ctx.beginPath();
    buildPath(ctx);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(front, 0, 0, width, height);
    ctx.restore();
    setNewSplitTransformCardSource(img, canvas, drawBack);
  };
}

function drawBack(img, canvas, ctx, width, height, source, buildPath) {
  const back = new Image();
  back.src = source;
  back.crossOrigin = "anonymous";
  back.onload = () => {
    ctx.save();
    ctx.beginPath();
    buildPath(ctx);
    ctx.closePath();
    ctx.clip();
    rotateContext(ctx, width, height);
    ctx.drawImage(back, 0, 0, width, height);
    ctx.restore();
    setNewSplitTransformCardSource(img, canvas);
  };
}

function initCanvas() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 63 * 4;
  canvas.height = 88 * 4;
  canvas.style.width = "63mm";
  canvas.style.height = "88mm";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return [canvas, ctx];
}

function createSplitTransformCard(img, mode, front, back) {
  if (mode === "frontDiagonalSplit") {
    const [canvas, ctx] = initCanvas();
    drawFront(img, canvas, ctx, canvas.width, canvas.height, front, function (
      context
    ) {
      context.moveTo(0, 0);
      context.lineTo(0, canvas.height);
      context.lineTo(canvas.width, 0);
    });
  } else if (mode === "backDiagonalSplit") {
    const [canvas, ctx] = initCanvas();
    drawBack(img, canvas, ctx, canvas.width, canvas.height, back, function (
      context
    ) {
      context.moveTo(canvas.width, 0);
      context.lineTo(0, canvas.height);
      context.lineTo(canvas.width, canvas.height);
    });
  } else if (mode === "doubleDiagonalSplit") {
    const [canvas, ctx] = initCanvas();
    debugger;
    drawFront(
      img,
      canvas,
      ctx,
      canvas.width,
      canvas.height,
      front,
      function (context) {
        context.moveTo(0, 0);
        context.lineTo(0, canvas.height);
        context.lineTo(canvas.width, 0);
      },
      () =>
        drawBack(img, canvas, ctx, canvas.width, canvas.height, back, function (
          context
        ) {
          context.moveTo(canvas.width, 0);
          context.lineTo(0, canvas.height);
          context.lineTo(canvas.width, canvas.height);
        })
    );
  } else if (mode === "frontArtSplit") {
    const [canvas, ctx] = initCanvas();
    drawFront(img, canvas, ctx, canvas.width, canvas.height, front, function (
      context
    ) {
      const w = canvas.width;
      const h = canvas.height;
      const a = (56 / 100) * h;
      const b = (44 / 100) * h;
      const c = (1 / 3) * w;
      const d = (2 / 3) * w;
      context.moveTo(0, 0);
      context.lineTo(0, a);
      context.lineTo(c, a);
      context.lineTo(d, b);
      context.lineTo(w, b);
      context.lineTo(w, 0);
    });
  } else if (mode === "backArtSplit") {
    const [canvas, ctx] = initCanvas();
    drawBack(img, canvas, ctx, canvas.width, canvas.height, back, function (
      context
    ) {
      const w = canvas.width;
      const h = canvas.height;
      const a = (56 / 100) * h;
      const b = (44 / 100) * h;
      const c = (1 / 3) * w;
      const d = (2 / 3) * w;
      context.moveTo(0, a);
      context.lineTo(c, a);
      context.lineTo(d, b);
      context.lineTo(w, b);
      context.lineTo(w, h);
      context.lineTo(0, h);
    });
  } else if (mode === "doubleArtSplit") {
    const [canvas, ctx] = initCanvas();
    drawFront(
      img,
      canvas,
      ctx,
      canvas.width,
      canvas.height,
      front,
      function (context) {
        const w = canvas.width;
        const h = canvas.height;
        const a = (56 / 100) * h;
        const b = (44 / 100) * h;
        const c = (1 / 3) * w;
        const d = (2 / 3) * w;
        context.moveTo(0, 0);
        context.lineTo(0, a);
        context.lineTo(c, a);
        context.lineTo(d, b);
        context.lineTo(w, b);
        context.lineTo(w, 0);
      },
      drawBack(img, canvas, ctx, canvas.width, canvas.height, back, function (
        context
      ) {
        const w = canvas.width;
        const h = canvas.height;
        const a = (56 / 100) * h;
        const b = (44 / 100) * h;
        const c = (1 / 3) * w;
        const d = (2 / 3) * w;
        context.moveTo(0, a);
        context.lineTo(c, a);
        context.lineTo(d, b);
        context.lineTo(w, b);
        context.lineTo(w, h);
        context.lineTo(0, h);
      })
    );
  } else if (mode === "frontHorizontalSplit") {
    const [canvas, ctx] = initCanvas();
    drawFront(img, canvas, ctx, canvas.width, canvas.height, front, function (
      context
    ) {
      const w = canvas.width;
      const h = canvas.height;
      const a = h / 2;
      context.moveTo(0, 0);
      context.lineTo(0, a);
      context.lineTo(w, a);
      context.lineTo(w, 0);
    });
  } else if (mode === "backHorizontalSplit") {
    const [canvas, ctx] = initCanvas();
    drawBack(img, canvas, ctx, canvas.width, canvas.height, back, function (
      context
    ) {
      const w = canvas.width;
      const h = canvas.height;
      const a = h / 2;
      context.moveTo(0, a);
      context.lineTo(w, a);
      context.lineTo(w, h);
      context.lineTo(0, h);
    });
  } else if (mode === "doubleHorizontalSplit") {
    const [canvas, ctx] = initCanvas();
    drawFront(
      img,
      canvas,
      ctx,
      canvas.width,
      canvas.height,
      front,
      function (context) {
        const w = canvas.width;
        const h = canvas.height;
        const a = h / 2;
        context.moveTo(0, 0);
        context.lineTo(0, a);
        context.lineTo(w, a);
        context.lineTo(w, 0);
      },
      drawBack(img, canvas, ctx, canvas.width, canvas.height, back, function (
        context
      ) {
        const w = canvas.width;
        const h = canvas.height;
        const a = h / 2;
        context.moveTo(0, a);
        context.lineTo(w, a);
        context.lineTo(w, h);
        context.lineTo(0, h);
      })
    );
  }
}

function setNewSplitTransformCardSource(img, canvas, continueWith = null) {
  // note: I promise that I will switch to promise later on.
  if (continueWith !== null) {
    continueWith();
  } else {
    img.src = canvas.toDataURL("image/jpeg", 1.0);
  }
}

document.querySelector(".splitTransform").onchange = function (e) {
  const imgs = [
    ...document.querySelectorAll(`.deck > div > img[data-face="0"]`),
  ];
  if (imgs.length == 0) return;
  const mode = e.target.value;
  if (mode === "without") {
    [
      ...document.querySelectorAll(`.deck > div.hidden > img[data-face="1"]`),
    ].forEach((img) => img.parentElement.classList.remove("hidden"));
    imgs.forEach((img) => (img.src = img.dataset.src));
    return;
  }
  [
    ...document.querySelectorAll(`.deck > div > img[data-face="1"]`),
  ].forEach((img) => img.parentElement.classList.add("hidden"));
  imgs.forEach((img) => {
    createSplitTransformCard(
      img,
      mode,
      img.dataset.src,
      img.parentElement.nextElementSibling.children[1].dataset.src
    );
  });
};

document.querySelector("#shareUrl").onclick = function () {
  const cards = document.querySelector("#cards").value.trim();
  const extraTokens = document.querySelector("#extra_tokens").value.trim();
  if (cards === "" && extraTokens === "") return;

  const url = new URL(location.href.replace(location.search, ""));
  if (!!cards) url.searchParams.append("cards", cards);
  if (!!extraTokens) url.searchParams.append("tokens", extraTokens);
  window.prompt("Copy permalink to clipboard: Ctrl+C, Enter", url);
};

const locationHref = new URL(window.location.href);
if (locationHref.search) {
  const searchParams = new URLSearchParams(locationHref.search);
  document.getElementById("cards").value = searchParams.get("cards");
  document.getElementById("extra_tokens").value = searchParams.get("tokens");
}

renderDeck();
document.querySelector(".splitTransform").value = "without";
