const SLUG_MAX = 60;

// Turn a restaurant name into a URL-friendly slug: "Chez Alex Café!" -> "chez-alex-cafe".
function slugify(name) {
  const slug = name
    .normalize('NFD')                 // split "é" into "e" + an accent mark
    .replace(/[̀-ͯ]/g, '')  // remove the accent marks
    .toLowerCase()
    .replace(/œ/g, 'oe')              // French letters that have no accent to remove
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')      // anything else becomes a dash
    .replace(/^-+|-+$/g, '')          // no dashes at the start or end
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '');
  return slug || 'restaurant';
}

// Make a slug that no other restaurant uses yet by adding -2, -3, ... if needed.
// ownRestaurantId is skipped so a restaurant never clashes with itself.
function uniqueSlug(name, restaurants, ownRestaurantId) {
  const base = slugify(name);
  const taken = restaurants
    .filter((r) => r.id !== ownRestaurantId)
    .map((r) => r.slug);

  let slug = base;
  let n = 2;
  while (taken.includes(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

module.exports = { uniqueSlug };
