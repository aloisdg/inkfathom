// http://tappedout.github.io/
// http://tappedout.net/mtg-forum/tappedout/tappedout-api/
// http://tappedout.net/mtg-forum/general/site-where-you-can-automatically-formatprint-off-a-whole-deck/ !com

let deckElement = document.querySelector('.deck');
const baseUrl = "https://api.scryfall.com/cards/search?q=name="

function extracts(input, from, to) {
    const start = input.indexOf(from) + from.length;
    const distance = input.lastIndexOf(to) - start;
    return input.substr(start, distance);
}

function indexOfNaN(input) {
    let i = 0;
    for (; input[i] >= '0' && input[i] <= '9'; i++);
    return i;
}

function cleanStars(input) {
    return input.replace(/ \*([^*]+)\*/g, '');
}

function parseContext(contextWithStars) {
    const context = cleanStars(contextWithStars); // todo: No foil, alter, language nor condition
    const number = context.substr(0, indexOfNaN(context));
    const quantity = number === "" ? 1 : parseInt(number);
    var start = number === "" ? 0 : context.indexOf(' ') + 1
    var distance = (context.includes(' (') ? context.indexOf(' (') : context.length) - start;
    const name = context.substr(start, distance);
    const edition = extracts(context, '(', ')');

    return {
        "name": name,
        "quantity": quantity,
        "edition": edition
    };
}

function getNextEdition(editions) {
    let i = 0;
    for (; i < editions.length && editions[i].image_url.endsWith('/0.jpg'); i++);
    return editions[i];
}

function selectRandomItems(items) {
    return items[Math.floor(Math.random() * items.length)];
}

// it could be nice to divide to get more of them
function selectIllustration(illustrations) {
    return selectRandomItems(illustrations).image_url;
}

function getCardImageUrls(data, name, setId) {
    // todo: should we handle name case?
    // todo: allow to get a specific edition card
    const cardData = data.data.filter(x => x.name === name)[0]
    if (cardData.card_faces === undefined)
        return [ cardData.image_uris.large ];
    return [ cardData.card_faces[0].image_uris.large, cardData.card_faces[1].image_uris.large ]
}

function appendCards(sources, quantity) {
    sources.forEach(source => {
        for (i = 0; i < quantity; i++) {
            let img = document.createElement("img")
            img.setAttribute("src", source)
            img.classList.add('noGutter')
            img.classList.add('smallSize')
            deckElement.appendChild(img)
        }
    });
}

function clean() {
    document.querySelector('main').innerHTML = ""
}

function isUrl(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i') // fragment locator
  return !!pattern.test(str)
}

function fill(value) {
    value.split('\n').forEach(context => {
        const card = parseContext(context)
 	    if (isUrl(card.name)) {
		    appendCards([card.name], card.quantity)
		    return
	    } 
        const url = baseUrl + encodeURI(card.name)
        fetch(url).then(response => response.json())
            .then(data => appendCards(getCardImageUrls(data, card.name, card.edition), card.quantity))
            .catch(e => console.log(`Booo:\n ${e}`))
    });
}


function renderDeck() {
    const value = document.querySelector('.cards').value.trim();
    if (value === '')
        return;

    clean();
    fill(value);
}

// const context = document.querySelector('.card').textContent;
// const card = parseContext(context);
// const url = baseUrl + encodeURI(card.name);

const locationHref = new URL(window.location.href)
if (locationHref.search) {
    const searchParams = new URLSearchParams(locationHref.search)
    document.getElementById('cards').value = searchParams.get('cards')
    renderDeck()
}

document.querySelector('.print')
    .addEventListener('click', function () {
        window.focus()
        window.print()
    }, false)

document.querySelector('.display')
    .addEventListener('click', function () {
        renderDeck()
    }, false)

const gutters = ['noGutter', 'lightGutter', 'boldGutter']
const sizes = ['tinySize', 'smallSize', 'normalSize']
// wtf classList is not iterable with filter
// let gutter = imgs[0].classList.filter(x => x.endsWith('Gutter'))
document.querySelector('.grid')
    .addEventListener('click', function () {
        let imgs = document.querySelectorAll(".deck img")
        if (imgs.length == 0) return
        let style = imgs[0].getAttribute('class').split(' ').find(x => x.endsWith('Gutter'))
        imgs.forEach(img => {
            img.classList.remove(style)
            img.classList.add(gutters[(gutters.indexOf(style) + 1) % gutters.length])
        })
    }, false)

document.querySelector('.size')
    .addEventListener('click', function () {
        let imgs = document.querySelectorAll(".deck img")
        if (imgs.length == 0) return
        let style = imgs[0].getAttribute('class').split(' ').find(x => x.endsWith('Size'))
        imgs.forEach(img => {
            img.classList.remove(style)
            img.classList.add(sizes[(sizes.indexOf(style) + 1) % sizes.length])
        })
    }, false)

    document.querySelector('h1')
    .addEventListener('click', function () {
        document.querySelector('.cards').value = "4 Soul Warden\n4 Burning-Tree Emissary\n4 Avacyn's Pilgrim\n4 Darkness\n4 Annul"
    }, false)
