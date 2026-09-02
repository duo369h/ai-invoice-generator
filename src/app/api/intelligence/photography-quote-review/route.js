import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../lib/supabase';
import { rateLimitAuthenticated } from '../../../lib/rate-limit';
import { authRequiredResponse, requestContextResponse } from '../../../lib/security';
import {
  buildPhotographyPreSendReview,
} from '../../../../core/quotes/photographyQuoteReview.js';
import {
  buildPhotographySemanticReviewInput,
  SemanticReviewInputError,
} from '../../../../core/intelligence/photographySemanticReviewInput.js';
import { runPhotographySemanticReview } from '../../../../core/intelligence/photographySemanticReview.js';
import {
  getSemanticReviewProvider,
  getSemanticReviewRuntimeConfig,
} from '../../../../core/intelligence/semanticReviewProviderConfig.js';

const ALLOWED_BODY_KEYS = new Set(['templateId', 'scope', 'lineItems', 'publicNotes', 'currency']);

const defaultDependencies = {
  getRequestUser,
  rateLimitAuthenticated,
  requestContextResponse,
  getSemanticReviewProvider,
};

function invalidInputResponse(error) {
  return NextResponse.json({ error: error.message || 'Invalid semantic review input.' }, { status: error.status || 400 });
}

export async function handlePhotographyQuoteReview(request, dependencies = defaultDependencies) {
  try {
    const context = await dependencies.getRequestUser(request);
    const contextFailure = dependencies.requestContextResponse(context, 'photography semantic review');
    if (contextFailure) return contextFailure;
    if (!context?.user?.id) return authRequiredResponse('photography semantic review');

    const limitResult = await dependencies.rateLimitAuthenticated('quoteGenerate', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Semantic review is temporarily rate limited.' }, { status: limitResult.status || 429 });
    }

    const body = await request.json().catch(() => {
      throw new SemanticReviewInputError('Request body must be valid JSON.');
    });
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !ALLOWED_BODY_KEYS.has(key))) {
      throw new SemanticReviewInputError('Only structured Quote review fields are accepted.');
    }
    const input = buildPhotographySemanticReviewInput(body);
    const deterministicFindings = buildPhotographyPreSendReview({ scope: input.scope, templateId: input.template.id });
    let provider = null;
    try {
      provider = dependencies.getSemanticReviewProvider({ config: getSemanticReviewRuntimeConfig() });
    } catch (_) {
      provider = null;
    }
    const result = await runPhotographySemanticReview({ input, provider, deterministicFindings });
    return NextResponse.json({
      status: result.status,
      findings: result.findings,
      semanticFindings: result.semanticFindings,
      inputFingerprint: result.inputFingerprint,
      ...(result.status === 'UNAVAILABLE_OR_ERROR'
        ? { message: 'Semantic review is unavailable right now. Structured checks remain active.' }
        : {}),
    });
  } catch (error) {
    if (error instanceof SemanticReviewInputError || error?.code === 'SEMANTIC_REVIEW_INVALID_INPUT') return invalidInputResponse(error);
    console.error('Photography semantic review route error:', error?.code || error?.message || error);
    return NextResponse.json({ error: 'Unable to prepare semantic review.' }, { status: 500 });
  }
}

export async function POST(request) {
  return handlePhotographyQuoteReview(request);
}
