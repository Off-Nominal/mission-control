import { compileExpression } from "filtrex";

const getFilterTerms = (filter: string) => {
  const expressionTerms = ["and", "or", "not", "if", "then", "else"];
  const arr = filter.split(" ");
  return arr
    .map((term) => term.replace(/([)(])/g, ""))
    .filter((term) => !expressionTerms.includes(term));
};

const filterexpression = "mars and jupiter and (not pluto or not saturn)";
const testdata =
  "mars mars pluto jupiter Agile Space Industries is preparing to consolidate propulsion design, manufacturing and production in a new 1,860-square-meter facility in Durango, Colorado.. The post Agile to consolidate operations in new Colorado plant appeared first on SpaceNews.";

const terms = getFilterTerms(filterexpression);
const regex = new RegExp(`\\b(${terms.join("|")})\\b`, "g");

const matches = testdata.matchAll(regex);

const evaluator = new Map(terms.map((term) => [term, false]));

for (const match of matches) {
  evaluator.set(match[0], true);
}

console.log(Object.fromEntries(evaluator));

const filter = compileExpression(filterexpression);
const result = filter(Object.fromEntries(evaluator));
console.log(result);
