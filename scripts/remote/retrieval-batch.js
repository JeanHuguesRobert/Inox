/**
 * Cogentia retrieval fulfiller for inox-serve (Supabase pgvector + OpenAI query embed).
 * Uses capability-host: inline when secrets exist, else inox.continuation.v1 (IoC).
 * Contract: cogentia docs/retrieval-roadmap.md batch request/response.
 */

import {
  createCapabilityHost,
  buildContinuationFromSteps,
  canInlineCapability,
} from "../serve/capability-host.js";

const DEFAULT_CORPUS = "cogentia-public";
const DEFAULT_MODEL = "text-embedding-3-small";
const DEFAULT_PROVIDER = "openai";
const DEFAULT_DIMENSIONS = 1536;

export async function packBatch(payload = {}, env = process.env, options = {}) {
  const queries = Array.isArray(payload.queries)
    ? payload.queries.map(item => String(item || "").trim()).filter(Boolean)
    : [];
  if (!queries.length) {
    return { ok: false, error: "missing_queries", strategy: "retrieval-supabase-batch-v1" };
  }

  const corpusKey = String(payload.corpus_key || env.COGENTIA_RETRIEVAL_CORPUS_KEY || DEFAULT_CORPUS);
  const indexHash = String(payload.index_hash || env.COGENTIA_RETRIEVAL_INDEX_HASH || "");
  const mode = String(payload.mode || "hybrid");
  const limit = Number(payload.limit || 4);
  const budget = Number(payload.budget || 2000);
  const provider = String(payload.provider || DEFAULT_PROVIDER);
  const modelName = String(payload.model_name || DEFAULT_MODEL);
  const dimensions = Number(payload.dimensions || DEFAULT_DIMENSIONS);

  const searchOptions = { corpusKey, indexHash, limit, budget, provider, modelName, dimensions, mode };
  const inline = options.inline !== false && canServeInline(env, mode);

  if (!inline) {
    const planHost = createCapabilityHost(env, { inline: false });
    const pendingSteps = [];
    for (const query of queries) {
      pendingSteps.push(...await planQuerySteps(query, planHost, searchOptions));
    }
    if (pendingSteps.length) {
      return buildContinuationFromSteps(pendingSteps, {
        operation: "retrieval.batch",
        payload: {
          queries,
          corpus_key: corpusKey,
          index_hash: indexHash,
          mode,
          limit,
          budget,
          provider,
          model_name: modelName,
          dimensions,
        },
      }, {
        corpus_key: corpusKey,
        query_count: queries.length,
      });
    }
  }

  const host = createCapabilityHost(env, { inline: true });
  const packs = [];
  const warnings = [];

  for (const query of queries) {
    const result = await searchQuery(query, host, searchOptions);
    if (!result.ok) return result;
    packs.push({ query, ...result.pack });
    warnings.push(...(result.pack.warnings || []));
  }

  return {
    ok: true,
    strategy: "retrieval-supabase-batch-v1",
    corpus_key: corpusKey,
    mode,
    count: packs.length,
    packs,
    warnings: [...new Set(warnings)],
  };
}

export async function resumePackBatch(continuation, resolved = [], env = process.env) {
  const state = continuation?.state || {};
  const payload = state.payload || {};
  if (state.operation !== "retrieval.batch") {
    return { ok: false, error: "unsupported_continuation_operation", operation: state.operation };
  }

  const fulfillmentByStep = new Map(resolved.map(item => [item.step.id, item.result]));
  const fulfillments = (continuation.pending || []).map(step => ({
    id: step.id,
    capability: step.capability,
    request: step.request,
    ok: true,
    result: fulfillmentByStep.get(step.id),
  }));
  const host = createCapabilityHost(env, { inline: false, fulfillments });

  const corpusKey = String(payload.corpus_key || DEFAULT_CORPUS);
  const searchOptions = {
    corpusKey,
    indexHash: String(payload.index_hash || ""),
    limit: Number(payload.limit || 4),
    budget: Number(payload.budget || 2000),
    provider: String(payload.provider || DEFAULT_PROVIDER),
    modelName: String(payload.model_name || DEFAULT_MODEL),
    dimensions: Number(payload.dimensions || DEFAULT_DIMENSIONS),
    mode: String(payload.mode || "hybrid"),
  };

  const queries = Array.isArray(payload.queries) ? payload.queries : [];
  const packs = [];
  const warnings = [];

  for (const query of queries) {
    const result = await searchQuery(query, host, searchOptions);
    if (!result.ok) return result;
    packs.push({ query, ...result.pack });
    warnings.push(...(result.pack.warnings || []));
  }

  return {
    ok: true,
    strategy: "retrieval-supabase-batch-v1",
    corpus_key: corpusKey,
    mode: searchOptions.mode,
    count: packs.length,
    packs,
    warnings: [...new Set(warnings)],
    resumed_from: continuation.id,
  };
}

function canServeInline(env, mode) {
  if (!canInlineCapability("supabase.rpc", env)) return false;
  if (mode === "keyword") return true;
  return canInlineCapability("openai.embeddings", env);
}

async function planQuerySteps(query, host, options) {
  const steps = [];
  if (options.mode !== "keyword") {
    const embed = await host.request("openai.embeddings", {
      model: options.modelName || DEFAULT_MODEL,
      input: query,
      dimensions: options.dimensions || DEFAULT_DIMENSIONS,
    }, { query, phase: "semantic_embed" });
    if (embed.continuation) steps.push(embed.step);

    const match = await host.request("supabase.rpc", {
      fn: "match_retrieval_chunks",
      args: {
        query_embedding: null,
        corpus_key: options.corpusKey,
        index_hash: options.indexHash || null,
        match_count: options.limit,
        provider_filter: options.provider,
        model_filter: options.modelName,
      },
    }, { query, phase: "semantic_match" });
    if (match.continuation) steps.push(match.step);
  }
  if (options.mode === "keyword" || options.mode === "hybrid") {
    const fts = await host.request("supabase.rpc", {
      fn: "search_retrieval_chunks_fts",
      args: {
        search_query: query,
        corpus_key: options.corpusKey,
        index_hash: options.indexHash || null,
        match_count: options.limit,
      },
    }, { query, phase: "keyword_fts" });
    if (fts.continuation) steps.push(fts.step);
  }
  return steps;
}

async function searchQuery(query, host, options) {
  if (options.mode === "keyword") {
    return keywordSearch(query, host, options);
  }
  return hybridSearch(query, host, options);
}

async function hybridSearch(query, host, options) {
  const semantic = await semanticSearch(query, host, options);
  if (semantic.ok && semantic.pack?.sources?.length) {
    return { ok: true, pack: semantic.pack };
  }
  const keyword = await keywordSearch(query, host, options);
  if (keyword.ok) {
    return {
      ok: true,
      pack: {
        ...keyword.pack,
        mode: "hybrid",
        warnings: [
          `Semantic retrieval unavailable; fell back to keyword (${semantic.error || "no_semantic_results"}).`,
          ...(keyword.pack.warnings || []),
        ],
      },
    };
  }
  return semantic.ok ? keyword : semantic;
}

async function semanticSearch(query, host, options) {
  const embedding = await requestEmbedding(host, query, options);
  if (!embedding.ok) {
    return {
      ok: false,
      error: embedding.error,
      query,
      mode: "semantic",
      warnings: embedding.warnings || [],
    };
  }

  const rows = await requestRpc(host, "match_retrieval_chunks", {
    query_embedding: embedding.result.embedding,
    corpus_key: options.corpusKey,
    index_hash: options.indexHash || null,
    match_count: options.limit,
    provider_filter: options.provider,
    model_filter: options.modelName,
  });
  if (!rows.ok) {
    return { ok: false, error: rows.error, query, mode: "semantic", warnings: [rows.message || rows.error] };
  }

  return {
    ok: true,
    pack: packFromRows(query, rows.result.data, {
      mode: "semantic",
      budget: options.budget,
      indexHash: options.indexHash,
      warnings: [`Semantic retrieval used Supabase pgvector (${options.modelName}, ${options.dimensions}d).`],
    }),
  };
}

async function keywordSearch(query, host, options) {
  const rows = await requestRpc(host, "search_retrieval_chunks_fts", {
    search_query: query,
    corpus_key: options.corpusKey,
    index_hash: options.indexHash || null,
    match_count: options.limit,
  });
  if (!rows.ok) {
    return { ok: false, error: rows.error, query, mode: "keyword", warnings: [rows.message || rows.error] };
  }
  return {
    ok: true,
    pack: packFromRows(query, rows.result.data, {
      mode: "keyword",
      budget: options.budget,
      indexHash: options.indexHash,
      warnings: ["Keyword retrieval used Supabase FTS."],
    }),
  };
}

async function requestEmbedding(host, query, options) {
  const answer = await host.request("openai.embeddings", {
    model: options.modelName || DEFAULT_MODEL,
    input: query,
    dimensions: options.dimensions || DEFAULT_DIMENSIONS,
  }, { query });
  if (!answer.ok || !answer.result?.ok) {
    return {
      ok: false,
      error: answer.result?.error || "query_embedding_failed",
      warnings: answer.result?.warnings || ["Set OPENAI_API_KEY for Supabase semantic retrieval."],
    };
  }
  return { ok: true, result: answer.result };
}

async function requestRpc(host, fn, args) {
  const answer = await host.request("supabase.rpc", { fn, args }, { fn });
  if (!answer.ok || !answer.result?.ok) {
    return {
      ok: false,
      error: answer.result?.error || "supabase_rpc_failed",
      message: answer.result?.message,
      fn,
    };
  }
  return { ok: true, result: answer.result };
}

function packFromRows(query, rows, options) {
  const list = Array.isArray(rows) ? rows : [];
  const sources = [];
  const context = [];
  let used = 0;
  const budget = Number(options.budget || 2000);
  for (const row of list) {
    const sourceId = String(row.source_id || "");
    const text = String(row.text || "").trim();
    if (!sourceId || !text) continue;
    const estimate = Math.ceil(text.length / 4);
    if (used + estimate > budget && context.length) continue;
    sources.push({
      source_id: sourceId,
      repo: row.repo,
      path: row.path,
      title: row.title || "",
      heading_path: row.heading_path || "",
      start_line: row.start_line,
      end_line: row.end_line,
      role: row.role || "",
      visibility: row.visibility || "public",
      github_url: row.github_url || "",
    });
    context.push({ source_id: sourceId, text });
    used += estimate;
  }
  const indexHash = options.indexHash || list[0]?.index_hash || "";
  return {
    ok: true,
    query,
    mode: options.mode || "semantic",
    index_hash: indexHash,
    schema_version: "0.1",
    sources,
    context,
    pack_hash: `supabase-${options.mode}-${query.length}-${sources.length}`,
    warnings: options.warnings || [],
    budget: { max_tokens: budget, used_tokens_estimate: used },
  };
}