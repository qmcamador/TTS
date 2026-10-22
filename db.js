// db.js — local in-memory lookup for Filipino words from entries.json

import entries from './entries.json';

export async function getWords(search = '', limit = 300) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return entries.slice(0, limit);
  }

  const filtered = entries.filter((item) => {
    const matchesWord = item.word.toLowerCase().includes(query);
    const matchesGloss = item.gloss && item.gloss.toLowerCase().includes(query);
    return matchesWord || matchesGloss;
  });

  return filtered.slice(0, limit);
}


export async function getWordById(id) {
  const found = entries.find((item) => String(item.id) === String(id));
  return found || null;
}