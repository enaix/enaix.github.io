
// Add random symbols to title
document.addEventListener('DOMContentLoaded', function () {
  let wrappers = document.getElementsByClassName("title-black-symbols");
  if (wrappers.length != 1) { return; }
  let titles = document.querySelector(".title-black");
  let spans = document.getElementsByClassName("title-black-symbols");
  if (titles === null) { return; }
  if (spans.length != 1) { return; }

  const char_candidates = ["🬶🬣🬟", "🬶🬤🬖", "🬯🬣🬢", "🬙🬱🬧", "🬜🬮🬌", "🬷🬤🬦", "🬗🬧", "🬅🬷🬅"];

  // A very stupid hash function (sum and mod)
  let title_hash = Math.sumPrecise(titles.innerHTML.split("").map(char => char.toUpperCase().charCodeAt(0) - 64)) % char_candidates.length;
  console.log(`Title has hash ${title_hash}`);
  spans[0].innerHTML = char_candidates[title_hash];
});
