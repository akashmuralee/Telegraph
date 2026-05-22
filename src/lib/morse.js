export const MORSE = {
  '.-': 'a',  '-...': 'b', '-.-.': 'c', '-..': 'd',  '.': 'e',
  '..-.': 'f', '--.': 'g', '....': 'h', '..': 'i',   '.---': 'j',
  '-.-': 'k',  '.-..': 'l', '--': 'm',   '-.': 'n',  '---': 'o',
  '.--.': 'p', '--.-': 'q', '.-.': 'r',  '...': 's', '-': 't',
  '..-': 'u',  '...-': 'v', '.--': 'w',  '-..-': 'x', '-.--': 'y',
  '--..': 'z',
};

export const REVERSE_MORSE = Object.fromEntries(
  Object.entries(MORSE).map(([code, letter]) => [letter, code])
);

export function decode(sequence) {
  return MORSE[sequence] ?? null;
}

export function encode(letter) {
  return REVERSE_MORSE[letter.toLowerCase()] ?? null;
}
