# diab

Deck In A Bottle is a webapp to format and display a mtg deck to create proxies. [Try it Online!](https://aloisdg.github.io/diab/)

## Motive

MTG is a great game. A great but expensive game. I can't afford to pay for a card I wont like after two or three games. Sometimes we have to try make our mind.

Proxies are acceptable in most casual game, so lets go to the printer and brrrr. Since I couldn't find a proxy maker suiting my need, I made my own. I don't want to keep copy/paste image in a document editor (Libre Office, Microsoft Word, or whatever).

[mtgpress.net](http://www.mtgpress.net/) is down, but alternatives include [proxymtg](http://proxymtg.net/) and [https://mtgprint.cardtrader.com/](https://mtgprint.cardtrader.com/). If you are looking for a windows app, you may like Tolarian Copyshop too. I create a comparaison table, feel free to open an issue if I missed anything:

|                              | ~         | mtgprint | proxymtg | tolarian copyshop |
|------------------------------|-----------|----------|----------|-------------------|
| has a good name              | [🚧 WIP](https://github.com/aloisdg/diab/issues/22) | ✔️        | ✔️        | ✔️                 |
| is free                      | ✔️         | ✔️        | ✔️        | ✔️                 |
| is ad-free                   | ✔️         | ✔️        | ✔️        | ✔️                 |
| is privacy friendly<sup>1</sup> | ✔️         | ❌        | ❌        | ✔️                 |
| is open source               | ✔️         | ❌        | ❌        | ✔️                 |
| is online                    | ✔️         | ✔️        | ✔️        | ❌                 |
| is cross plateform           | ✔️         | ✔️        | ✔️        | ❌                 |
| is community-driven<sup>2</sup> | ✔️         | ❌        | ❌        | ❌                 |
| support text-only            | ✔️         | ❌        | ❌        | [🚧 WIP](https://trello.com/c/fu3vex2u/72-text-only-print-option)         |
| support token                | ✔️         | ✔️        | ✔️        | ?                 |
| support flip card            | ✔️         | ✔️        | ❌        | [🚧 WIP](https://trello.com/c/aesAIHhO/73-print-front-and-backside-of-double-faced-cards)                 |
| support custom card          | ✔️         | ❌        | ❌        | ?                 |
| support different card size  | ✔️         | ✔️        | ❌        | ?                 |
| support different paper size | [🚧 WIP](https://github.com/aloisdg/diab/issues/23) | ✔️        | ❌        | ?                 |
| can specificy a set          | ✔️         | ✔️        | ?        | ✔️                 |
| can skip basic land          | [🚧 WIP](https://github.com/aloisdg/diab/issues/19) | ✔️        | ?        | ?                 |
| can print decklist           | [🚧 WIP](https://github.com/aloisdg/diab/issues/34) | ✔️        | ❌        | ?                 |

1. ublock origin wont block anything on the page.
1. Anyone can contribute, participate, submit issue, etc. as long as you follow our code of conduct.

## Changelog

### 2020-10-26

* Handle tokens from URL #29
* Resize custom artwork before printing #31
* Add a printer friendly mode #17

### 2020-10-09

* Manage doubled-faced cards #10
* Handle direct url as cards #12

Showcase payload:

	2 Nicol Bolas, the Ravager // Nicol Bolas, the Arisen
	2 https://preview.redd.it/o24hrebvwrr51.png?width=497&auto=webp&s=7040a065ffd8aff38c661b31f7196d4a8b72863b
	1 https://external-preview.redd.it/8a6muxHWVtH8ygmy7ktGcsKE-p20WWJfyPoO5Zg5-cg.jpg?width=375&auto=webp&s=5e644fe3065893dcac903f4e1641cf1fb79019aa
	1 Riverglide Pathway // Lavaglide Pathway

### 2019-06-25

* Get cards from scryfall's api

### 2017-05-10

* Get cards from deckbrew's api
* Build the first parser

## Stack

All the code can run on any decent browser. Everything works client-side. Bare old vanillaJS and HTML/CSS. No more no less.

Picture rendering come from [Scryfall](https://scryfall.com/).

## Legal

* All informations presented through this website about Magic: The Gathering is copyrighted by Wizards of the Coast.
* This website are not produced, endorsed, supported, or affiliated with Wizards of the Coast.
