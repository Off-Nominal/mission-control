import { compileExpression } from "filtrex";
import { FeedParserEntry } from "../../utilities/FeedWatcher/types";
import { NewsFeedDocument } from "../../providers/sanity";

const getFilterTerms = (filter: string) => {
  const expressionTerms = ["and", "or", "not", "if", "then", "else"];
  const arr = filter.split(" ");
  return arr
    .map((term) => term.replace(/([)(])/g, ""))
    .filter((term) => !expressionTerms.includes(term));
};

export const shouldFilter = (
  entry: FeedParserEntry,
  feed: NewsFeedDocument
) => {
  if (!feed.filter) {
    return false;
  }

  try {
    const filterExpression = feed.filter;
    const filter = compileExpression(filterExpression);
    const terms = getFilterTerms(filterExpression);
    const regex = new RegExp(`\\b(${terms.join("|")})\\b`, "g");

    const testString =
      entry.title + " " + entry.description + " " + entry.summary;
    const matches = testString.toLowerCase().matchAll(regex);
    const evaluator = new Map(terms.map((term) => [term, false]));

    for (const match of matches) {
      evaluator.set(match[0], true);
    }

    return !filter(Object.fromEntries(evaluator));
  } catch (err) {
    console.error(`Error in filter expression for ${feed.name}`);
    console.error(err);
    return false;
  }
};
