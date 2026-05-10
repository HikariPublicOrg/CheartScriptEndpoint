'use client'

import { useState } from 'react'
import { useClient } from './ClientContext'

export default function HealthCheck() {
  const { online, clientUsername } = useClient()
  const [showGuide, setShowGuide] = useState(false)
  const [showHint, setShowHint] = useState(true)

  return (
    <>
      <span
        className={`health-badge ${online ? 'online' : 'offline'}`}
        onClick={() => !online && setShowGuide(true)}
        style={{ cursor: online ? 'default' : 'pointer' }}
      >
        {online && clientUsername ? clientUsername : 'Offline'}
      </span>

      {!online && showHint && (
        <span className="connect-hint" onClick={() => setShowGuide(true)}>
          How to connect Cheart client
          <button className="hint-close" onClick={e => { e.stopPropagation(); setShowHint(false) }}>&times;</button>
        </span>
      )}

      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect Cheart Client</h3>
              <button className="modal-close" onClick={() => setShowGuide(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="step">
                <span className="step-num">1</span>
                <div className="step-text">
                  Download HttpServer:&nbsp;
                  <a href="https://ygdprjzwyhlwezekylfd.supabase.co/storage/v1/object/public/cheart-script/SakuraNiroku/httpserver.bsh" target="_blank" rel="noopener noreferrer">
                    httpserver.bsh
                  </a>
                </div>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <div className="step-text">In Cheart client, type <code>.script folder</code> to open the scripts folder</div>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <div className="step-text">Drag <code>httpserver.bsh</code> into the scripts folder</div>
              </div>
              <div className="step">
                <span className="step-num">4</span>
                <div className="step-text">In Cheart client, type <code>.script reload</code></div>
              </div>
              <div className="step">
                <span className="step-num">5</span>
                <div className="step-text">Enable the <strong>HttpServer</strong> module in ClickGUI</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
