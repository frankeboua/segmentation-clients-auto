import { RAW } from './raw-data'

export type Segment = 'A' | 'B' | 'C' | 'D'
export type SpendKey = 'L' | 'A' | 'H'

export type Customer = {
  g: string
  m: string
  gr: string
  p: string | null
  sp: SpendKey
  seg: Segment
  age: number
  fam: number | null
  we: number | null
}

export const SEGS: Segment[] = ['A', 'B', 'C', 'D']
export const COLORS: Record<Segment, string> = {
  A: '#2563eb',
  B: '#d97706',
  C: '#059669',
  D: '#e11d48',
}

export const PROFS = [
  'Artist',
  'Doctor',
  'Engineer',
  'Entertainment',
  'Executive',
  'Healthcare',
  'Homemaker',
  'Lawyer',
  'Marketing',
]
export const PROFS_FR: Record<string, string> = {
  Artist: 'Artiste',
  Doctor: 'Médecin',
  Engineer: 'Ingénieur',
  Entertainment: 'Divertissement',
  Executive: 'Cadre dirigeant',
  Healthcare: 'Santé (paramédical)',
  Homemaker: 'Au foyer',
  Lawyer: 'Avocat',
  Marketing: 'Marketing',
}

export const SPEND: SpendKey[] = ['L', 'A', 'H']
export const SPEND_FR: Record<SpendKey, string> = {
  L: 'Faible (Low)',
  A: 'Moyen (Average)',
  H: 'Élevé (High)',
}
export const SPEND_COLORS: Record<SpendKey, string> = {
  L: '#cbd5e1',
  A: '#64748b',
  H: '#0f172a',
}

export const fmt = new Intl.NumberFormat('fr-FR')
export const pct = (v: number) => (v * 100).toFixed(0) + ' %'
export const mean = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

export const CUSTOMERS: Customer[] = RAW.split(',').map((s) => ({
  g: s[0],
  m: s[1],
  gr: s[2],
  p: s[3] === '9' ? null : PROFS[+s[3]],
  sp: s[4] as SpendKey,
  seg: s[5] as Segment,
  age: +s.slice(6, 8),
  fam: s[8] === '0' ? null : +s[8],
  we: s.slice(9, 11) === '99' ? null : +s.slice(9, 11),
}))

export const PROFILES: Record<
  Segment,
  { title: string; facts: string[]; reco: string }
> = {
  A: {
    title: 'Actifs établis, dépense prudente',
    facts: [
      'Âge moyen ~45 ans',
      'Mix marié (58 %) / célibataire',
      'Diplômés à 62 %',
      'Artiste, Divertissement, Ingénieur',
      'Spending Score faible à 69 %',
    ],
    reco: 'Mettre en avant le rapport qualité-prix : modèles fiables, garanties étendues et offres de reprise. Cibler les ingénieurs et professions créatives via des essais personnalisés.',
  },
  B: {
    title: 'Couples matures, dépense en hausse',
    facts: [
      'Âge moyen ~48 ans',
      'Mariés à 73 %',
      'Diplômés à 72 %',
      'Artiste en tête (41 %)',
      'Mix équilibré : 32 % moyen, 21 % élevé',
    ],
    reco: 'Proposer une montée en gamme : finitions supérieures, SUV familiaux et financement LOA. Programmes de fidélité et relances au moment du renouvellement.',
  },
  C: {
    title: 'Diplômés mariés, cœur Artiste',
    facts: [
      'Âge moyen ~49 ans',
      'Mariés à 79 %',
      'Diplômés à 82 % (le plus élevé)',
      'Artiste majoritaire (54 %)',
      'Spending Score moyen dominant (46 %)',
    ],
    reco: 'Cibler le segment premium accessible : design, confort et technologies. Événements exclusifs et contenus inspirants autour du style, adaptés à un public créatif.',
  },
  D: {
    title: 'Jeunes célibataires, budget serré',
    facts: [
      'Âge moyen ~33 ans (le plus jeune)',
      'Jamais mariés à 71 %',
      'Non diplômés à 63 %',
      'Santé (43 %) et Marketing surreprésentés',
      'Spending Score faible à 87 %',
    ],
    reco: 'Miser sur l’accessibilité : premiers véhicules, occasion certifiée, petites mensualités et partenariats avec les établissements de santé. Communication digitale et réseaux sociaux.',
  },
}

/* Classifieur bayésien naïf entraîné sur l'ensemble des clients */

export type ClassifyInput = {
  g: string
  m: string
  gr: string
  p: string
  sp: SpendKey
  age: number
  fam: number
}

type FeatureKey = keyof ClassifyInput
type FeatureValue = string | number | null

export const ageBucket = (a: number) =>
  a < 25 ? 0 : a < 35 ? 1 : a < 45 ? 2 : a < 55 ? 3 : a < 65 ? 4 : 5
export const famBucket = (f: number) => Math.min(5, f)

const FEATURES: Record<FeatureKey, (r: Customer) => FeatureValue> = {
  g: (r) => r.g,
  m: (r) => (r.m === '?' ? null : r.m),
  gr: (r) => (r.gr === '?' ? null : r.gr),
  p: (r) => r.p,
  sp: (r) => r.sp,
  age: (r) => ageBucket(r.age),
  fam: (r) => (r.fam === null ? null : famBucket(r.fam)),
}

type Counter = Record<string, number> & { total: number }

const model = (() => {
  const prior = {} as Record<Segment, number>
  const counts = {} as Record<Segment, Record<string, Counter>>
  const cats: Record<string, Set<FeatureValue>> = {}
  const keys = Object.keys(FEATURES) as FeatureKey[]
  SEGS.forEach((s) => {
    prior[s] = 0
    counts[s] = {}
  })
  keys.forEach((k) => {
    cats[k] = new Set()
    SEGS.forEach((s) => {
      counts[s][k] = { total: 0 } as Counter
    })
  })
  CUSTOMERS.forEach((r) => {
    prior[r.seg]++
    for (const k of keys) {
      const v = FEATURES[k](r)
      if (v === null) continue
      cats[k].add(v)
      const c = counts[r.seg][k]
      c[String(v)] = (c[String(v)] || 0) + 1
      c.total++
    }
  })
  return { prior, counts, cats, n: CUSTOMERS.length, keys }
})()

export function classify(input: ClassifyInput): { s: Segment; p: number }[] {
  const logs = SEGS.map((s) => {
    let lp = Math.log(model.prior[s] / model.n)
    for (const k of model.keys) {
      const v = input[k]
      const c = model.counts[s][k]
      lp += Math.log(((c[String(v)] || 0) + 1) / (c.total + model.cats[k].size))
    }
    return lp
  })
  const max = Math.max(...logs)
  const exp = logs.map((l) => Math.exp(l - max))
  const sum = exp.reduce((a, b) => a + b, 0)
  return SEGS.map((s, i) => ({ s, p: exp[i] / sum })).sort((a, b) => b.p - a.p)
}
