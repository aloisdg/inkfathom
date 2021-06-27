let deckElement = document.querySelector(".deck");
const baseUrl = "https://api.scryfall.com/cards/search?q=";
const cardPath = "name=";
const tokenPath = "t:token%20name=";
const emblemPath = "t:emblem%20name=";

const minScale = 30;
const maxScale = 300;

document.querySelector(".scale-component .minus").onclick = () => {
  const current = parseInt(document.querySelector(".value").value);
  const nextValue = current <= minScale ? minScale : current - 1;
  document.querySelector(".scale-component .value").value = nextValue;
  document.querySelector(".scale-component .value").dispatchEvent(new Event("change"));
};

document.querySelector(".scale-component .plus").onclick = () => {
  const current = parseInt(document.querySelector(".value").value);
  const nextValue = current >= maxScale ? maxScale : current + 1;
  document.querySelector(".scale-component .value").value = nextValue;
  document.querySelector(".scale-component .value").dispatchEvent(new Event("change"));
};

const isAllowed = (paste) =>
  !isDigits(paste) || parseInt(paste) < minScale || parseInt(paste) > maxScale;

document
  .querySelector(".scale-component .value")
  .addEventListener("paste", (event) => {
    const paste = (event.clipboardData || window.clipboardData).getData("text");

    if (isAllowed(paste)) {
      event.preventDefault();
      return;
    }
  });

const getCardUrl = (cardName, set) =>
  `${baseUrl}${cardPath}${encodeURI(cardName)}${!!set ? `%20set:${set}` : ""}`;

const getTokenUrl = (cardName, set) =>
  `${baseUrl}${tokenPath}${encodeURI(cardName)}${
    !!set ? `%20set:${set.length === 3 ? "t" : ""}${set}` : ""
  }`;
const getEmblemUrl = (cardName, set) =>
  `${baseUrl}${emblemPath}${encodeURI(cardName)}${
    !!set ? `%20set:${set.length === 3 ? "t" : ""}${set}` : ""
  }`;

function extracts(input, from, to) {
  const start = input.indexOf(from) + from.length;
  const distance = input.lastIndexOf(to) - start;
  return input.substr(start, distance);
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

function getEmblemImageUrls(data, name) {
  const cardData = data.data.filter((x) => x.name === name + " Emblem")[0];
  if (cardData.name === undefined) return [];
  if (cardData.name === name + " Emblem" && cardData.layout === "emblem")
    return [
      buildCardDataset(cardData, cardData.prints_search_uri, cardData.set),
    ];
  if (cardData.layout !== "double_faced_emblem") return []; // note: is it possible?
  const face = cardData.card_faces.find((f) => f.name === name);
  return face === undefined
    ? []
    : [buildCardDataset(face, face.prints_search_uri, face.set)];
}

function appendCards(sources, quantity, isCustom, configuration) {
  sources.forEach((source) => {
    for (let i = 0; i < quantity; i++) {
      const div = document.createElement("div");
      div.classList.add(
        "flex",
        "relative",
        "justify-center",
        "align-center",
        configuration.gutter
      );

      div.style.width = scaleWidth(configuration.scale) + "mm";
      div.style.height = scaleHeight(configuration.scale) + "mm";

      const loader = document.createElement("div");
      loader.classList.add("absolute", "z--1");
      loader.innerHTML = getLoaderHtml(80, 80);
      div.appendChild(loader);

      const img = document.createElement("img");
      const src = isCustom ? source.source : source.source;
      img.crossOrigin = "anonymous";
      img.setAttribute("src", src);
      img.classList.add(configuration.gutter);
      img.style.width = scaleWidth(configuration.scale) + "mm";
      img.style.height = scaleHeight(configuration.scale) + "mm";
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

const CardType = {
  Classic: "Classic",
  Token: "Token",
  Emblem: "Emblem",
};

function getTypeUrl(cardType, name, set) {
  if (cardType === CardType.Token) return getTokenUrl(name, set);
  if (cardType === CardType.Emblem) return getEmblemUrl(name, set);
  return getCardUrl(name, set);
}

function getTypeImageUrls(cardType, data, name, edition) {
  if (cardType === CardType.Token) return getTokenImageUrls(data, name);
  if (cardType === CardType.Emblem) return getEmblemImageUrls(data, name);
  return getCardImageUrls(data, name, edition);
}

const keywords = ["Deck", "Sideboard", "Maybeboard"];
function fill(value, cardType, configuration) {
  [...value.split("\n")]
    .filter((line) => !!line.trim() && !keywords.includes(line.trim()))
    .forEach((context) => {
      const card = parseContext(context);
      if (isUrl(card.name)) {
        appendCards(
          [{ source: card.name, custom: true, isBasicLand: false }],
          card.quantity,
          true,
          configuration
        );
        return;
      }
      const url = getTypeUrl(cardType, card.name, card.set);
      fetch(url)
        .then((response) => response.json())
        .then((data) =>
          appendCards(
            getTypeImageUrls(cardType, data, card.name, card.edition),
            card.quantity,
            false,
            configuration
          )
        )
        .catch((e) => {
          appendToErrorList(card.name);
          console.error(`Booo:\n ${e}`);
        });
    });
}

const { jsPDF } = window.jspdf;

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

function print() {
  const imgs = document.querySelectorAll(".deck > div:not(.hidden) > img");
  const sheet =
    sheetFormat[document.querySelector(".sheet").value.toLowerCase()];
  const deckSize = imgs.length;

  const scale = parseInt(
    document.querySelector(".scale-component .value").value
  );
  const card = getCardSize(scale);
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
  doc.save(buildPdfName(deckSize, card.name));
}

function getBase64Image(img, width, height) {
  const biggerFactor = 4; // hackfix
  const classes = img.className;
  img.className = "";
  var canvas = document.createElement("canvas");
  canvas.width = parseInt(img.width) * biggerFactor;
  canvas.height = parseInt(img.height) * biggerFactor;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(
    img,
    0,
    0,
    parseInt(img.width) * biggerFactor,
    parseInt(img.height) * biggerFactor
  );
  var dataURL = canvas.toDataURL("image/jpg");
  img.className = classes;
  return dataURL.replace(/^data:image\/jpg;base64,/, "");
}

function renderDeck() {
  const cards = document.querySelector(".cards").value.trim();
  const tokens = document.querySelector("#extra_tokens").value.trim();
  const emblems = document.querySelector("#extra_emblems").value.trim();
  if (cards === "" && tokens === "" && emblems === "") return;
  clean();
  cleanErrorList();
  let configuration = {
    scale: parseInt(document.querySelector(".scale-component .value").value),
    gutter: document.querySelector(".gutter").value,
  };
  if (!!cards) fill(cards, CardType.Classic, configuration);
  if (!!tokens) fill(tokens, CardType.Token, configuration);
  if (!!tokens) fill(emblems, CardType.Emblem, configuration);
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

function formatSwitchButtonContent(set, position, total) {
  return `${set} ${position}/${total}`;
}

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
              .large === img.src
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
        img.src = (
          img.dataset.face ? next.card_faces[+img.dataset.face] : next
        ).image_uris.large;
      })
      .catch((e) => console.error(`Booo:\n ${e}`));
  } else {
    const prints = JSON.parse(img.dataset.alternativePrints);
    const current = prints.findIndex((print) => print.source === img.src);
    const next = prints[current === prints.length - 1 ? 0 : current + 1];
    img.onload = function () {
      e.target.textContent = formatSwitchButtonContent(
        next.set,
        current + 1,
        prints.length
      );
      e.target.removeAttribute("disabled");
    };
    img.src = next.source;
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

document.querySelector(".scale-component .value").onchange = function (e) {
  let imgs = document.querySelectorAll(".deck > div > img");
  if (imgs.length == 0) return;
  // const previous = e.target.dataset.scale ?? "100";
  const scale = parseInt(e.target.value);
  const newWidth = scaleWidth(scale);
  const newHeight = scaleHeight(scale);
  imgs.forEach((img) => {
    img.style.width = newWidth + "mm";
    img.style.height = newHeight + "mm";
    img.parentElement.style.width = newWidth + "mm";
    img.parentElement.style.height = newHeight + "mm";
  });
  // e.target.dataset.scale = e.target.value;
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
  let imgs = document.querySelectorAll(".deck >div > img");
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

document.querySelector("#shareUrl").onclick = function () {
  const cards = document.querySelector("#cards").value.trim();
  const extraTokens = document.querySelector("#extra_tokens").value.trim();
  const extraEmblems = document.querySelector("#extra_emblems").value.trim();
  if (cards === "" && extraTokens === "" && extraEmblems === "") return;

  const url = new URL(location.href.replace(location.search, ""));
  if (!!cards) url.searchParams.append("cards", cards);
  if (!!extraTokens) url.searchParams.append("tokens", extraTokens);
  if (!!extraEmblems) url.searchParams.append("emblems", extraEmblems);
  window.prompt("Copy permalink to clipboard: Ctrl+C, Enter", url);
};

const locationHref = new URL(window.location.href);
if (locationHref.search) {
  const searchParams = new URLSearchParams(locationHref.search);
  document.getElementById("cards").value = searchParams.get("cards");
  document.getElementById("extra_tokens").value = searchParams.get("tokens");
  document.getElementById("extra_emblems").value = searchParams.get("emblems");
}
renderDeck();
