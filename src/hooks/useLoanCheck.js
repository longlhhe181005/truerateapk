import { useCallback, useState } from 'react';
import { analyze } from '../engine/analyze';
import { explain, hasBackend } from '../api/backend';
import useApp from './useApp';

/**
 * Runs one check: code computes everything locally, then (if a backend is configured)
 * the AI wording replaces the fixed explanation. A failed AI call never blocks the result.
 */
export default function useLoanCheck() {
  const { addCheck } = useApp();
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async (input) => {
      const { errors, result } = analyze(input);
      if (errors) return { errors };

      let final = result;
      if (hasBackend) {
        setLoading(true);
        try {
          final = { ...result, ...(await explain(input)) };
        } catch (e) {
          final = { ...result, ai: { mode: 'offline', note: e.message } };
        } finally {
          setLoading(false);
        }
      }
      addCheck(input, final);
      return { result: final };
    },
    [addCheck]
  );

  return { run, loading };
}
