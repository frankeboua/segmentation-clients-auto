'use client'

import { useMemo, useState } from 'react'
import { COLORS, CUSTOMERS, SEGS, fmt, mean, pct } from '@/lib/segmentation'
import {
  AgeChart,
  DistChart,
  FamilyChart,
  ProfChart,
  SpendChart,
  type ProfMode,
} from './charts'
import { Classifier } from './classifier'
import { Insights } from './insights'

const GENDER_LABEL: Record<string, string> = { M: 'Homme', F: 'Femme' }
const MARRIED_LABEL: Record<string, string> = { Y: 'Déjà marié(e)', N: 'Jamais marié(e)' }
const GRAD_LABEL: Record<string, string> = { Y: 'Diplômé(e)', N: 'Non diplômé(e)' }

export function Dashboard() {
  const [gender, setGender] = useState('')
  const [married, setMarried] = useState('')
  const [grad, setGrad] = useState('')
  const [profMode, setProfMode] = useState<ProfMode>('share')

  const rows = useMemo(
    () =>
      CUSTOMERS.filter(
        (r) =>
          (!gender || r.g === gender) &&
          (!married || r.m === married) &&
          (!grad || r.gr === grad),
      ),
    [gender, married, grad],
  )

  const total = rows.length
  const counts = SEGS.map((s) => rows.filter((r) => r.seg === s).length)
  const avgAge = total ? mean(rows.map((r) => r.age)).toFixed(1).replace('.', ',') + ' ans' : '–'

  const activeLabels = [
    gender && GENDER_LABEL[gender],
    married && MARRIED_LABEL[married],
    grad && GRAD_LABEL[grad],
  ].filter(Boolean)

  const reset = () => {
    setGender('')
    setMarried('')
    setGrad('')
  }

  return (
    <main className="wrap">
      <header>
        <div>
          <p className="eyebrow">Concession automobile · Équipe marketing</p>
          <h1>Comprendre nos segments clients</h1>
          <p className="sub">
            Analyse de 8 068 clients répartis en quatre segments (A, B, C, D). Filtrez la
            population pour explorer chaque profil, puis utilisez l&apos;outil de classement
            pour estimer le segment d&apos;un nouveau client.
          </p>
        </div>
        <form className="filters" aria-label="Filtres" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="f-gender">Genre</label>
            <select id="f-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Tous</option>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-married">Statut marital</label>
            <select id="f-married" value={married} onChange={(e) => setMarried(e.target.value)}>
              <option value="">Tous</option>
              <option value="Y">Déjà marié(e)</option>
              <option value="N">Jamais marié(e)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-grad">Diplôme</label>
            <select id="f-grad" value={grad} onChange={(e) => setGrad(e.target.value)}>
              <option value="">Tous</option>
              <option value="Y">Diplômé(e)</option>
              <option value="N">Non diplômé(e)</option>
            </select>
          </div>
          <button type="button" onClick={reset}>
            Réinitialiser
          </button>
          <p className="active-note" aria-live="polite">
            {activeLabels.length
              ? `Filtres actifs : ${activeLabels.join(' · ')} — ${fmt.format(total)} clients affichés.`
              : 'Aucun filtre : l’ensemble des clients est affiché.'}
          </p>
        </form>
      </header>

      <section className="kpis" aria-label="Indicateurs clés">
        <div className="card">
          <span className="kpi-label">Nombre total de clients</span>
          <span className="kpi-value">{fmt.format(total)}</span>
        </div>
        <div className="card">
          <span className="kpi-label">Âge moyen</span>
          <span className="kpi-value">{avgAge}</span>
        </div>
        <div className="card kpi-span">
          <span className="kpi-label">Répartition par segment</span>
          <div
            className="segbar"
            role="img"
            aria-label={
              'Répartition : ' +
              SEGS.map((s, i) => `segment ${s} ${total ? pct(counts[i] / total) : '0 %'}`).join(', ')
            }
          >
            {SEGS.map((s, i) => (
              <span
                key={s}
                style={{ width: `${total ? (counts[i] / total) * 100 : 0}%`, background: COLORS[s] }}
              />
            ))}
          </div>
          <div className="seglegend">
            {SEGS.map((s, i) => (
              <div key={s}>
                <small>
                  <span className="dot" style={{ background: COLORS[s] }} />
                  Segment {s}
                </small>
                <b>{fmt.format(counts[i])}</b>
                <small>{total ? pct(counts[i] / total) : '0 %'}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid two" aria-label="Graphiques principaux">
        <article className="card">
          <div className="card-head">
            <div>
              <h2>Répartition des clients par segment</h2>
              <p>Nombre de clients dans chaque segment</p>
            </div>
          </div>
          <div className="chart" role="img" aria-label="Graphique de répartition par segment">
            <DistChart rows={rows} />
          </div>
        </article>
        <article className="card">
          <div className="card-head">
            <div>
              <h2>Âge moyen par segment</h2>
              <p>Le segment D est nettement plus jeune</p>
            </div>
          </div>
          <div className="chart" role="img" aria-label="Âge moyen par segment">
            <AgeChart rows={rows} />
          </div>
        </article>
      </section>

      <section className="grid" aria-label="Professions">
        <article className="card">
          <div className="card-head">
            <div>
              <h2>Professions par segment</h2>
              <p>
                {profMode === 'share'
                  ? 'Pour chaque profession, part des clients dans chaque segment'
                  : 'Nombre de clients par profession et par segment'}
              </p>
            </div>
            <div className="toggle" role="group" aria-label="Mode d'affichage des professions">
              <button
                type="button"
                aria-pressed={profMode === 'share'}
                onClick={() => setProfMode('share')}
              >
                % par profession
              </button>
              <button
                type="button"
                aria-pressed={profMode === 'count'}
                onClick={() => setProfMode('count')}
              >
                Effectifs
              </button>
            </div>
          </div>
          <div className="chart tall" role="img" aria-label="Professions par segment">
            <ProfChart rows={rows} mode={profMode} />
          </div>
        </article>
      </section>

      <section className="grid two" aria-label="Spending Score">
        <article className="card">
          <div className="card-head">
            <div>
              <h2>Spending Score par segment</h2>
              <p>Composition de chaque segment selon le niveau de dépense</p>
            </div>
          </div>
          <div className="chart" role="img" aria-label="Spending score par segment">
            <SpendChart rows={rows} />
          </div>
        </article>
        <article className="card">
          <div className="card-head">
            <div>
              <h2>Taille du foyer et expérience</h2>
              <p>Moyennes par segment (valeurs manquantes exclues)</p>
            </div>
          </div>
          <div
            className="chart"
            role="img"
            aria-label="Taille du foyer et expérience moyenne par segment"
          >
            <FamilyChart rows={rows} />
          </div>
        </article>
      </section>

      <div className="section-title">
        <h2 style={{ fontSize: 20 }}>Enseignements clés</h2>
        <p className="sub">
          Profil type de chaque segment, calculé sur l&apos;ensemble des 8 068 clients, et action
          marketing recommandée.
        </p>
      </div>
      <Insights />

      <div className="section-title">
        <h2 style={{ fontSize: 20 }}>Classer un nouveau client</h2>
        <p className="sub">
          Estimation probabiliste (classifieur bayésien naïf) entraînée sur les données
          historiques. À utiliser comme aide à la décision, pas comme vérité absolue.
        </p>
      </div>
      <Classifier />

      <footer>
        Source : DS_CustSegment.csv · 8 068 clients · Les valeurs manquantes sont exclues des
        calculs concernés.
      </footer>
    </main>
  )
}
