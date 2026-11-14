import type { CSSProperties } from 'react'
import { COLORS, PROFILES, SEGS } from '@/lib/segmentation'

export function Insights() {
  return (
    <section className="insights" aria-label="Enseignements clés">
      {SEGS.map((s) => {
        const p = PROFILES[s]
        return (
          <article
            key={s}
            className="card insight"
            style={{ '--c': COLORS[s] } as CSSProperties}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="tag" aria-hidden="true">
                {s}
              </span>
              <div>
                <h3>Segment {s}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{p.title}</p>
              </div>
            </div>
            <ul>
              {p.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="reco">
              <strong>Recommandation</strong>
              {p.reco}
            </div>
          </article>
        )
      })}
    </section>
  )
}
