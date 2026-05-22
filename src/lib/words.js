export const WORD_POOL = [
  'the','of','to','and','a','in','is','it','you','that','he','was','for','on','are',
  'with','as','i','his','they','be','at','one','have','this','from','or','had','by',
  'not','but','what','all','were','when','we','there','can','an','your','which','their',
  'said','if','do','will','each','about','how','up','out','them','then','she','many',
  'some','so','these','would','other','into','has','more','her','two','like','him','see',
  'time','could','no','make','than','first','been','its','who','now','people','my','made',
  'over','did','down','only','way','find','use','may','water','long','little','very','after',
  'called','just','where','most','know','get','through','back','much','go','good','new',
  'write','our','me','man','too','any','day','same','right','look','think','also','around',
  'another','came','come','work','three','word','must','because','does','part','even','place',
  'well','such','here','take','why','help','put','away','again','off','went','old',
  'number','great','tell','men','say','small','every','found','still','name','should',
  'home','big','give','air','line','set','own','under','read','last','never','us','left','end',
  'while','might','next','sound','below','saw','both','few','those','always','show','large',
  'often','asked','house','world','going','want','school','until','form','food','keep','feet',
  'land','side','boy','once','life','took','four','head','above','kind','began','almost','live',
  'page','earth','need','far','hand','high','year','light','father','let','night','being',
  'study','second','soon','story','since','white','ever','paper','hard','near','better','best',
  'across','during','today',
];

export function pickWords(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
  }
  return out;
}
