import assert from "node:assert/strict";
import { parseOpenAIResponse } from "../lib/llm/responses.ts";

const parsed = parseOpenAIResponse({
  output: [
    {
      type: "web_search_call",
      status: "completed",
      action: {
        type: "search",
        query: "AI chip supply chain bottlenecks 2026",
        sources: [
          { url: "https://example.com/industry", title: "Industry source" },
          { url: "https://example.com/filing", title: "Company filing" },
          { url: "javascript:alert(1)", title: "Invalid source" },
        ],
      },
    },
    {
      type: "message",
      role: "assistant",
      content: [
        {
          type: "output_text",
          text: '{"demand_driver":"AI compute growth"}',
          annotations: [
            {
              type: "url_citation",
              url: "https://example.com/filing",
              title: "Primary filing",
            },
          ],
        },
      ],
    },
  ],
});

assert.equal(parsed.outputText, '{"demand_driver":"AI compute growth"}');
assert.equal(parsed.webSearchUsed, true);
assert.deepEqual(parsed.searchQueries, ["AI chip supply chain bottlenecks 2026"]);
assert.equal(parsed.sources.length, 2);
assert.deepEqual(parsed.sources[0], {
  url: "https://example.com/industry",
  title: "Industry source",
  cited: false,
});
assert.deepEqual(parsed.sources[1], {
  url: "https://example.com/filing",
  title: "Primary filing",
  cited: true,
});

console.log("Responses parser: output text, queries, citations, source deduplication, and URL filtering passed.");
