import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const STORAGE_KEY = 'kodoro_utm';

export type UtmParams = Partial<Record<typeof UTM_KEYS[number], string>> & {
  referrer?: string;
  landing_page?: string;
};

/**
 * Lit les paramètres UTM depuis l'URL courante.
 * Si des UTMs sont présents dans l'URL, ils sont sauvegardés en sessionStorage
 * et remplacent les éventuels UTMs précédemment stockés.
 * Si l'URL n'a pas d'UTMs, on récupère ceux du sessionStorage (navigation précédente).
 *
 * Ainsi un visiteur qui arrive via un lien Meta, navigue sur la page /gaming
 * puis clique Réserver conserve ses UTMs sur /reservation-gaming.
 */
export function useUtm(): UtmParams {
  const location = useLocation();
  const [utms, setUtms] = useState<UtmParams>({});

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const fromUrl: UtmParams = {};

    UTM_KEYS.forEach(k => {
      const v = sp.get(k);
      if (v) fromUrl[k] = v;
    });

    if (Object.keys(fromUrl).length > 0) {
      // UTMs présents dans l'URL → on les sauvegarde et on enregistre la landing page
      fromUrl.referrer     = document.referrer || undefined;
      fromUrl.landing_page = window.location.href;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
      } catch { /* sessionStorage indisponible (mode privé strict) */ }
      setUtms(fromUrl);
    } else {
      // Pas d'UTMs dans l'URL → on tente de récupérer depuis sessionStorage
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) setUtms(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, [location.search]);

  return utms;
}

/**
 * Construit une query string UTM à partir des paramètres stockés.
 * Utile pour construire des liens qui transmettent les UTMs.
 */
export function buildUtmQuery(utms: UtmParams): string {
  const params = new URLSearchParams();
  UTM_KEYS.forEach(k => { if (utms[k]) params.set(k, utms[k]!); });
  return params.toString() ? `?${params.toString()}` : '';
}
