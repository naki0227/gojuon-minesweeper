# Third-party question data

Some question-bank entries are derived from public open-source datasets.

## PokéAPI

- Source: https://github.com/PokeAPI/pokeapi
- Used datasets: localized Pokémon species names, move names, item names, and ability names.
- License: BSD-style license in the upstream `LICENSE.md`.
- Pokémon and Pokémon character names are trademarks of Nintendo, as noted by the upstream project.

Imported entries are filtered so that the current kana / alphabet boards can represent them.

## imsky/wordlists

- Source: https://github.com/imsky/wordlists
- Used datasets: categorized English noun/topic lists.
- License: MIT.

The import only keeps entries that normalize cleanly onto the A-Z board and have a playable normalized length.
