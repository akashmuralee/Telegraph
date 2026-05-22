// Source material for typing tests. We work in sentences (lowercase, a–z
// only, no punctuation) and slice them into a word list at test-build time.
// Sentences keep the test feeling intentional instead of random.
export const SENTENCE_POOL = [
  'the quick brown fox jumps over the lazy dog',
  'practice makes perfect when you are learning something new',
  'every journey of a thousand miles begins with a single step',
  'when life gives you lemons make lemonade and enjoy it',
  'actions speak louder than words in most cases of doubt',
  'do not count your chickens before they have all hatched',
  'a picture is worth more than a thousand spoken words',
  'where there is a will there is always a way forward',
  'two heads are better than one when solving any problem',
  'do not judge a book by its cover at the first glance',
  'every cloud has a silver lining hidden somewhere within it',
  'the grass always seems greener on the other side of the fence',
  'fortune favors the bold and the brave hearted ones',
  'a watched pot never seems to boil any faster',
  'the best things in life are often the simplest ones',
  'home is where the heart finds peace at the end of the day',
  'time and tide wait for no one regardless of their plans',
  'honesty is the best policy in nearly any situation you face',
  'better late than never as the wise old saying still goes',
  'no man is an island in this deeply connected modern world',
  'let sleeping dogs lie until they decide to wake on their own',
  'absence makes the heart grow fonder with each passing day',
  'beauty is in the eye of the beholder so they often say',
  'all good things must come to an end at some point',
  'birds of a feather always seem to flock together in the sky',
];

// Pick exactly `targetCount` words by stitching whole sentences end to end
// and truncating the last one if it overflows.
export function pickWords(targetCount) {
  const words = [];
  // Bail out cap so we never spin forever if the pool is ever empty.
  let safety = 200;
  while (words.length < targetCount && safety-- > 0) {
    const sentence =
      SENTENCE_POOL[Math.floor(Math.random() * SENTENCE_POOL.length)];
    for (const w of sentence.split(' ')) {
      if (words.length >= targetCount) break;
      words.push(w);
    }
  }
  return words;
}
