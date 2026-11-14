'use client'

import { useMemo, useState } from 'react'
import {
  COLORS,
  PROFILES,
  PROFS,
  PROFS_FR,
  SEGS,
  ageBucket,
  classify,
  famBucket,
  pct,
  type SpendKey,
} from '@/lib/segmentation'

export function Classifier() {
  const [gender, setGender] = useState('M')
  const [age, setAge] = useState('30')
  const [married, setMarried] = useState('N')
  const [grad, setGrad] = useState('N')
  const [prof, setProf] = useState('Healthcare')
  const [spend, setSpend] = useState<SpendKey>('L')
  const [family, setFamily] = useState('3')

  const results = useMemo(() => {
    const a = Math.min(95, Math.max(18, +age || 30))
    const f = Math.min(9, Math.max(1, +family || 1))
    return classify({
      g: gender,
      m: married,
      gr: grad,
      p: prof,
      sp: spend,
      age: ageBucket(a),
      fam: famBucket(f),
    })
  }, [gender, age, married, grad, prof, spend, family])

  const top = results[0]

  return (
    <section className="card" aria-label="Classement d'un nouveau client">
      <div className="classify-wrap">
        <form className="classify-form" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="n-gender">Genre</label>
            <select id="n-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="n-age">Âge</label>
            <input
              id="n-age"
              type="number"
              min={18}
              max={95}
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="n-married">Déjà marié(e)</label>
            <select id="n-married" value={married} onChange={(e) => setMarried(e.target.value)}>
              <option value="N">Non</option>
              <option value="Y">Oui</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="n-grad">Diplômé(e)</label>
            <select id="n-grad" value={grad} onChange={(e) => setGrad(e.target.value)}>
              <option value="N">Non</option>
              <option value="Y">Oui</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="n-prof">Profession</label>
            <select id="n-prof" value={prof} onChange={(e) => setProf(e.target.value)}>
              {PROFS.map((p) => (
                <option key={p} value={p}>
                  {PROFS_FR[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="n-spend">Spending Score</label>
            <select
              id="n-spend"
              value={spend}
              onChange={(e) => setSpend(e.target.value as SpendKey)}
            >
              <option value="L">Faible (Low)</option>
              <option value="A">Moyen (Average)</option>
              <option value="H">Élevé (High)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="n-family">Taille du foyer</label>
            <input
              id="n-family"
              type="number"
              min={1}
              max={9}
              inputMode="numeric"
              value={family}
              onChange={(e) => setFamily(e.target.value)}
            />
          </div>
        </form>

        <div className="result" aria-live="polite">
          <div className="verdict" style={{ borderColor: COLORS[top.s] }}>
            Segment le plus probable :{' '}
            <strong style={{ color: COLORS[top.s] }}>Segment {top.s}</strong> ({pct(top.p)})
            <br />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{PROFILES[top.s].title}</span>
          </div>
          <div>
            {SEGS.map((s) => {
              const p = results.find((x) => x.s === s)!.p
              return (
                <div className="prob-row" key={s}>
                  <span>
                    <span className="dot" style={{ background: COLORS[s] }} />
                    Segment {s}
                  </span>
                  <div className="prob-track">
                    <span style={{ width: `${p * 100}%`, background: COLORS[s] }} />
                  </div>
                  <span style={{ textAlign: 'right' }}>{pct(p)}</span>
                </div>
              )
            })}
          </div>
          <div className="reco">
            <strong>Action suggérée</strong>
            {PROFILES[top.s].reco}
          </div>
        </div>
      </div>
    </section>
  )
}
