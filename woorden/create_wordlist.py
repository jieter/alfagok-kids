# Builds the dictionary for Alfagok kids, next to the hand-kept list of secret words:
#
# - woord-van-de-dag.txt (kept by hand): the secret word for each day, simple words children
#   know. The first line is 1 November 2026; add new words at the end, so existing days stay.
# - woordenboek.txt (generated here): as many Dutch words as possible, used to tell
#   whether a guess is a real word. Always includes the secret words.
#
# Based on https://codeberg.org/diginaut/alfagok/src/commit/a86d792dabbb382d347e84e4021850e4949865ca/wordlist
# Word lists by OpenTaal (https://github.com/OpenTaal/opentaal-wordlist), BSD / CC BY 3.0.
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCES = HERE / 'bronnen'
OPENTAAL_URL = 'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/elements/'
OPENTAAL_FILES = [
    'basiswoorden-gekeurd.txt',
    'basiswoorden-ongekeurd.txt',
    # Vervoegingen and such, see https://nl.wikipedia.org/wiki/Flexie_(taalkunde)
    'flexies-ongekeurd.txt',
]
# Used when present, like in the original script
OPTIONAL_FILES = ['wikiwoordenboek_basiswoorden.lst', 'scrabblewoorden.txt']

DICTIONARY = HERE / 'woordenboek.txt'
WORD_OF_THE_DAY = HERE / 'woord-van-de-dag.txt'


def read_words(path):
    return [line.strip() for line in path.read_text(encoding='utf-8').splitlines()]


def write_words(path, words):
    path.write_text(''.join(f'{word}\n' for word in words), encoding='utf-8')


def is_valid(word):
    # Only lowercase words without digits, spaces, hyphens or apostrophes
    return word.isalpha() and word.lower() == word


SOURCES.mkdir(exist_ok=True)
all_words = []
for name in OPENTAAL_FILES:
    path = SOURCES / name
    if not path.is_file():
        print(f'downloading {name}')
        urllib.request.urlretrieve(OPENTAAL_URL + name, path)
    words = read_words(path)
    print(f'{name} contains {len(words)} words')
    all_words += words

for name in OPTIONAL_FILES:
    path = SOURCES / name
    if path.is_file():
        words = read_words(path)
        print(f'{name} contains {len(words)} words')
        all_words += words
    else:
        print(f'{name} not found, skipped')

secret_words = [word for word in read_words(WORD_OF_THE_DAY) if word]
print(f'woord-van-de-dag.txt contains {len(secret_words)} words')
# Not removed automatically, as that would move all later days
duplicates = sorted({word for word in secret_words if secret_words.count(word) > 1})
if duplicates:
    print(f'warning: these words are in woord-van-de-dag.txt more than once: {" ".join(duplicates)}')

dictionary = {word for word in all_words if is_valid(word)}
missing = sorted(set(secret_words) - dictionary)
if missing:
    print(f'{len(missing)} secret words were not in the sources, added anyway: {" ".join(missing)}')
dictionary |= set(secret_words)

write_words(DICTIONARY, sorted(dictionary, key=str.casefold))

print(f'done writing {len(dictionary)} words to woordenboek.txt')
