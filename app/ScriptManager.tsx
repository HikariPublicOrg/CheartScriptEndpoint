'use client'

import { useEffect, useState, FormEvent } from 'react'

interface Script {
  script_name: string
  script_author: string
  desc: string | null
  version: string | null
  created_at: string
}

type Tab = 'browse' | 'mine'

export default function ScriptManager() {
  const [tab, setTab] = useState<Tab>('browse')
  const [allScripts, setAllScripts] = useState<Script[]>([])
  const [myScripts, setMyScripts] = useState<Script[]>([])
  const [scriptName, setScriptName] = useState('')
  const [version, setVersion] = useState('')
  const [desc, setDesc] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchAllScripts()
  }, [])

  useEffect(() => {
    if (tab === 'mine') fetchMyScripts()
  }, [tab])

  async function fetchAllScripts() {
    try {
      const res = await fetch('/api/script/list')
      const data = await res.json()
      if (Array.isArray(data)) setAllScripts(data)
    } catch (err) {
      console.error('Failed to fetch scripts:', err)
    }
  }

  async function fetchMyScripts() {
    try {
      const res = await fetch('/api/user/script/list')
      const data = await res.json()
      if (Array.isArray(data)) setMyScripts(data)
    } catch (err) {
      console.error('Failed to fetch scripts:', err)
    }
  }

  async function handleEdit(script: Script) {
    setLoading(true)
    setStatus(null)
    try {
      const encodedName = encodeURIComponent(script.script_name)
      const encodedAuthor = encodeURIComponent(script.script_author)
      const res = await fetch(`/api/getscript?name=${encodedName}&author=${encodedAuthor}`)
      if (!res.ok) throw new Error('Failed to load script')
      const text = await res.text()

      setScriptName(script.script_name)
      setVersion(script.version || '')
      setDesc(script.desc || '')
      setContent(text)
      setEditing(true)
    } catch (_err) {
      setStatus({ type: 'error', message: 'Failed to load script content' })
    } finally {
      setLoading(false)
    }
  }

  function handleNew() {
    setScriptName('')
    setVersion('')
    setDesc('')
    setContent('')
    setEditing(false)
    setStatus(null)
  }

  async function handleDownload(script: Script) {
    try {
      const encodedName = encodeURIComponent(script.script_name)
      const encodedAuthor = encodeURIComponent(script.script_author)
      const res = await fetch(`/api/getscript?name=${encodedName}&author=${encodedAuthor}`)
      if (!res.ok) throw new Error('Failed to fetch script')
      const text = await res.text()
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${script.script_name}.bsh`
      a.click()
      URL.revokeObjectURL(url)
    } catch (_err) {
      setStatus({ type: 'error', message: 'Download failed' })
    }
  }

  function handleInstall(_script: Script) {
    // TODO: implement install logic
  }

  const [dragging, setDragging] = useState(false)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.bsh')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') {
        setContent(text)
        if (!scriptName) setScriptName(file.name.replace('.bsh', ''))
      }
    }
    reader.readAsText(file)
  }

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault()

    const trimmedName = scriptName.trim()
    if (!trimmedName) {
      setStatus({ type: 'error', message: 'Script name is required' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/user/script/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_name: trimmedName,
          version,
          desc,
          content,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Request failed' })
      } else if (data.deleted) {
        setStatus({ type: 'success', message: `Script "${trimmedName}" deleted` })
        setScriptName('')
        setVersion('')
        setDesc('')
        setContent('')
        setEditing(false)
        fetchMyScripts()
      } else {
        setStatus({ type: 'success', message: `Script "${trimmedName}" saved` })
        fetchMyScripts()
      }
    } catch (_err) {
      setStatus({ type: 'error', message: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Tab Switcher */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === 'browse' ? 'active' : ''}`}
          onClick={() => setTab('browse')}
        >
          Browse
        </button>
        <button
          className={`tab-btn ${tab === 'mine' ? 'active' : ''}`}
          onClick={() => setTab('mine')}
        >
          My Scripts
        </button>
      </div>

      {/* Browse Tab */}
      {tab === 'browse' && (
        <div className="form-card">
          <h2>All Scripts</h2>
          {allScripts.length === 0 ? (
            <p style={{ color: '#666', fontSize: 14 }}>No scripts yet</p>
          ) : (
            <div className="script-list">
              {allScripts.map(s => (
                <div key={`${s.script_author}/${s.script_name}`} className="script-item">
                  <div className="script-info">
                    <span className="script-name">
                      {s.script_name}
                      {s.version && <span className="script-version">{s.version}</span>}
                    </span>
                    <span className="script-author">by {s.script_author}</span>
                    {s.desc && <span className="script-desc">{s.desc}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => handleDownload(s)}
                      disabled={loading}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="btn btn-small btn-install"
                      onClick={() => handleInstall(s)}
                      disabled={loading}
                    >
                      Install
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Scripts Tab */}
      {tab === 'mine' && (
        <>
          {/* Script List */}
          <div className="form-card">
            <h2>My Scripts</h2>
            {myScripts.length === 0 ? (
              <p style={{ color: '#666', fontSize: 14 }}>No scripts yet</p>
            ) : (
              <div className="script-list">
                {myScripts.map(s => (
                  <div key={`${s.script_author}/${s.script_name}`} className="script-item">
                    <div className="script-info">
                      <span className="script-name">
                        {s.script_name}
                        {s.version && <span className="script-version">{s.version}</span>}
                      </span>
                      {s.desc && <span className="script-desc">{s.desc}</span>}
                      <span className="script-date">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => handleEdit(s)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor */}
          <form className="form-card" onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2>{editing ? `Edit: ${scriptName}` : 'New Script'}</h2>
              {editing && (
                <button type="button" className="btn btn-small" onClick={handleNew}>
                  + New
                </button>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Script Name</label>
                <input
                  type="text"
                  value={scriptName}
                  onChange={e => setScriptName(e.target.value)}
                  placeholder="my-script"
                  disabled={editing}
                  required
                />
              </div>
              <div className="form-group">
                <label>Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="What does this script do?"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label>Content</label>
              <div
                className={`drop-zone ${dragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste your script here, or drop a .bsh file..."
                />
                {dragging && <div className="drop-overlay">Drop .bsh file here</div>}
              </div>
            </div>
            <div className="btn-row">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editing ? 'Update Script' : 'Save Script'}
              </button>
            </div>
            {status && (
              <div className={`status ${status.type}`}>{status.message}</div>
            )}
          </form>
        </>
      )}
    </>
  )
}
