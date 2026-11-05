import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLiveTriviaQuestions } from '../services/contentEngine/triviaService';

describe('trivia source failure behavior', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('does not substitute an undocumented question bank when the licensed source fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(fetchLiveTriviaQuestions(5)).resolves.toEqual([]);
  });
});
