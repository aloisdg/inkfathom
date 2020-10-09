# diab

Deck In A Bottle is a webapp to format and display a mtg deck in the goal to create proxies.

[live](https://aloisdg.github.io/diab/)

## Motive

MTG is a great game. A great but expensive game. I can't afford to pay for a card I wont like after two or three game. Sometimes we have to try one to know. Proxies are acceptable in most casual game. Since I can't find a deck creator suiting my need, I made one. I don't want to keep copy/paste image in a document editor (Libre Office, Microsoft Word, or whatever). Here we go.

Alternatives include [mtgpress.net](http://www.mtgpress.net/) and [https://mtgprint.cardtrader.com/](https://mtgprint.cardtrader.com/).

## Changelog

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
