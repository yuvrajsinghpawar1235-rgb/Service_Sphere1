import React, { useState } from 'react';
import { createKnowledgeArticle } from '../services/api';

const CATEGORIES = ['General', 'Hardware', 'Software', 'Network', 'Account/Access', 'Security'];
const STATUSES = ['PUBLISHED', 'DRAFT'];

const KnowledgeBaseTab = ({ articles = [], user = null, onArticleCreated }) => {
  const [query, setQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('PUBLISHED');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canCreateArticle = !user || (user.roleId != null && Number(user.roleId) !== 1);

  const filtered = articles.filter((a) => {
    const q = query.toLowerCase();
    return (
      (a.title || '').toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q) ||
      (a.body || a.content || '').toLowerCase().includes(q) ||
      (a.tags || '').toLowerCase().includes(q)
    );
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim() || !body.trim()) {
      setErrorMsg('Title and article body are required.');
      return;
    }

    const effectiveSummary =
      summary.trim() || body.trim().slice(0, 140) + (body.trim().length > 140 ? '...' : '');

    const payload = {
      title: title.trim(),
      summary: effectiveSummary,
      body: body.trim(),
      category,
      tags: tags.trim(),
      author: user?.fullName || user?.email || 'Support Staff',
      status,
    };

    setSubmitting(true);
    try {
      await createKnowledgeArticle(payload, user?.roleId ?? 2);
      setTitle('');
      setSummary('');
      setBody('');
      setTags('');
      setCategory('General');
      setStatus('PUBLISHED');
      setShowCreateForm(false);
      setSuccessMsg('Knowledge base article saved.');
      if (onArticleCreated) {
        await onArticleCreated();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not create knowledge base article.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
      {/* Left Column: Search, Create Form & Quick Guidelines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Knowledge Search</h3>
            {canCreateArticle && (
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm((prev) => !prev);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {showCreateForm ? 'Close Form' : '+ New Article'}
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Search articles (e.g., VPN, Password)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />

          {successMsg && (
            <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: '#ecfdf5', color: '#047857', fontSize: '12px', fontWeight: '600' }}>
              {successMsg}
            </div>
          )}

          {showCreateForm && canCreateArticle && (
            <form onSubmit={handleCreateSubmit} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {errorMsg && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#fef2f2', color: '#b91c1c', fontSize: '12px', fontWeight: '600' }}>
                  {errorMsg}
                </div>
              )}

              <input
                type="text"
                placeholder="Article Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />

              <input
                type="text"
                placeholder="Short Summary (optional)"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Tags (comma-separated, e.g., vpn, wifi)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />

              <textarea
                placeholder="Write step-by-step resolution instructions *"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows="4"
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Saving...' : 'Publish Article'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '16px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#2563eb' }}>💡 Quick Tip</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
              Search standard operating procedures and troubleshooting guides before escalating to tier-2 support agents.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Article Feed */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>
          Articles Found ({filtered.length})
        </h3>
        {filtered.length === 0 ? (
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
            No knowledge base articles match your query.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
            {filtered.map((art) => (
              <div
                key={art.id}
                style={{ background: 'white', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', transition: 'border 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                  <h4 style={{ margin: 0, color: '#2563eb', fontSize: '15px', fontWeight: '700' }}>{art.title}</h4>
                  <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                    {art.category || 'General'}
                  </span>
                </div>
                <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                  {art.body || art.content || art.summary}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b' }}>
                  <span>{art.author ? `By ${art.author}` : ''}</span>
                  <span style={{ color: '#2563eb', fontWeight: '600' }}>{art.status || 'PUBLISHED'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseTab;