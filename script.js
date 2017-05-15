// http://tappedout.github.io/
// http://tappedout.net/mtg-forum/tappedout/tappedout-api/
// http://tappedout.net/mtg-forum/general/site-where-you-can-automatically-formatprint-off-a-whole-deck/ !com

let deckElement = document.querySelector('.deck');
const baseUrl = "https://api.deckbrew.com/mtg/cards?name="

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

function getImageUrl(data, name, setId) {
    const editions = data.filter(x => x.name === name)[0].editions;
    const edition = setId ?
        editions.filter(x => x.set_id === setId) :
        getNextEdition(editions);

    return edition.image_url ?
        edition.image_url :
        selectIllustration(edition);
}

function appendCard(source, quantity) {
    while (quantity--) {
        let img = document.createElement("img");
        img.setAttribute("src", source);
        deckElement.appendChild(img);
    }
}

function clean() {
    document.querySelector('main').innerHTML = ""
}

function fill(value) {
    value.split('\n').forEach(context => {
        const card = parseContext(context);
        const url = baseUrl + encodeURI(card.name);

        fetch(url).then(response => response.json())
            .then(data => appendCard(getImageUrl(data, card.name, card.edition), card.quantity))
            .catch(e => console.log("Booo"))
    });
}

function renderDeck() {
    const value = document.querySelector('.cards').value;
    if (value === '')
        return;

    clean();
    fill(value);
}

// const context = document.querySelector('.card').textContent;
// const card = parseContext(context);
// const url = baseUrl + encodeURI(card.name);

const locationHref = new URL(window.location.href)
const searchParams = new URLSearchParams(locationHref.search)
document.getElementById('cards').value = searchParams.get('cards')

document.querySelector('.print')
    .addEventListener('click', function () {
        window.focus()
        window.print()
    }, false);

document.querySelector('.display')
    .addEventListener('click', function () {
        renderDeck();
    }, false);
