import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';

type Entries = ReadonlyArray<Readonly<[string, string]>>;

const toSearchParams = (entries: Entries) => {
  const sp = new URLSearchParams();
  entries.forEach(([k, v]) => sp.set(k, String(v)));
  return sp;
};

export const useQueryHelper = () => {
  const router = useRouter();

  const queryParams: { [key: string]: string } = useMemo(() => {
    // Use asPath to preserve query as strings reliably
    const search = router.asPath.split('?')[1] ?? '';
    const sp = new URLSearchParams(search);
    const map: { [key: string]: string } = {};
    sp.forEach((v, k) => {
      map[k] = v;
    });
    return map;
  }, [router.asPath]);

  const getRegularQuery = useCallback(
    (key: string, fallback: string = ''): string => {
      return queryParams[key] ?? fallback;
    },
    [queryParams]
  );

  const getFilterQuery = useCallback(
    (key: string, fallback: string = 'all'): string => {
      return queryParams[key] ?? fallback;
    },
    [queryParams]
  );

  const replaceQuery = useCallback(
    (next: { [key: string]: string }) => {
      const current = Object.entries(queryParams) as Entries;
      const merged = { ...Object.fromEntries(current), ...next } as { [k: string]: string };
      // Remove empty values from URL
      const cleaned = Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== undefined && v !== null && v !== '')
      ) as { [k: string]: string };
      const sp = toSearchParams(Object.entries(cleaned) as Entries);
      const path = router.pathname + (sp.toString() ? `?${sp.toString()}` : '');
      router.replace(path, undefined, { shallow: true });
    },
    [queryParams, router]
  );

  const updateRegularQuery = useCallback(
    (updates: { [key: string]: string | number | boolean | undefined | null }, options?: { resetPage?: boolean }) => {
      const stringified: { [k: string]: string } = {};
      Object.entries(updates).forEach(([k, v]) => {
        stringified[k] = v === undefined || v === null ? '' : String(v);
      });
      if (options?.resetPage) {
        stringified.page = '1';
      }
      replaceQuery(stringified);
    },
    [replaceQuery]
  );

  const updateFilterQuery = useCallback(
    (key: string, value: string | number | boolean | undefined | null | Record<string, unknown>) => {
      // Support DSL components that pass option objects
      const extracted = (value && typeof value === 'object' && 'value' in (value as any))
        ? (value as any).value
        : value;
      const nextVal = extracted === undefined || extracted === null ? '' : String(extracted);
      replaceQuery({ [key]: nextVal, page: '1' });
    },
    [replaceQuery]
  );

  const getQueriesForAPI = useCallback(
    <T extends ReadonlyArray<Readonly<{ key: string; defaultValue?: string }>>>(
      defs: T
    ): { [K in T[number] as K['key']]: string } => {
      const out = {} as any;
      defs.forEach(({ key, defaultValue }) => {
        out[key] = queryParams[key] ?? (defaultValue !== undefined ? String(defaultValue) : '');
      });
      return out;
    },
    [queryParams]
  );

  return {
    queryParams,
    getRegularQuery,
    getFilterQuery,
    updateRegularQuery,
    updateFilterQuery,
    getQueriesForAPI,
  };
};

export default useQueryHelper;


