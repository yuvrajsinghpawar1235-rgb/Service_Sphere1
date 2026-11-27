import React, { useState, useEffect, useMemo } from 'react';
import {
  getTickets,
  createTicket,
  updateTicketStatus,
  updateTicketPriority,
  assignTicketAgent,
  getAssets,
  createAsset,
  updateAssetStatus,
  getKnowledgeArticles,
  reportService
} from './services/api';

import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import FilterPills from './components/FilterPills';
import TicketDetailsModal from './components/TicketDetailsModal';
import AssetInventoryTab from './components/AssetInventoryTab';
import KnowledgeBaseTab from './components/KnowledgeBaseTab';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Live Report Metrics State
  const [ticketSummary, setTicketSummary] = useState({ totalTickets: 0, openTickets: 0, resolvedTickets: 0 });
  const [slaMetrics, setSlaMetrics] = useState({ complianceRate: '100%', breachedCount: 0 });
  const [assetSummary, setAssetSummary] = useState({ totalAssets: 0, assignedAssets: 0, availableAssets: 0 });

  const [ticketFilter, setTicketFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [ticketForm, setTicketForm] = useState({ title: '', description: '', priority: 'Medium', category: 'Hardware' });
  const [assetForm, setAssetForm] = useState({ assetTag: '', assetType: 'Laptop', brand: '', model: '', location: '', status: 'Available' });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [ticketData, assetData, articleData, tSummary, sMetrics, aSummary] = await Promise.all([
        getTickets().catch(() => []),
        getAssets().catch(() => []),
        getKnowledgeArticles().catch(() => []),
        reportService.getTicketSummary().catch(() => ({ totalTickets: 0, openTickets: 0, resolvedTickets: 0 })),
        reportService.getSlaMetrics().catch(() => ({ complianceRate: '100%', breachedCount: 0 })),
        reportService.getAssetSummary().catch(() => ({ totalAssets: 0, assignedAssets: 0, availableAssets: 0 }))
      ]);

      setTickets(Array.isArray(ticketData) ? ticketData : (ticketData?.content || []));
      setAssets(Array.isArray(assetData) ? assetData : (assetData?.content || []));
      setArticles(Array.isArray(articleData) ? articleData : (articleData?.content || []));
      setTicketSummary(tSummary);
      setSlaMetrics(sMetrics);
      setAssetSummary(aSummary);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const safeTickets = useMemo(() => (Array.isArray(tickets) ? tickets : []), [tickets]);
  const safeAssets = useMemo(() => (Array.isArray(assets) ? assets : []), [assets]);
  const safeArticles = useMemo(() => (Array.isArray(articles) ? articles : []), [articles]);

  const filteredTickets = useMemo(() => {
    return safeTickets.filter(t => {
      if (ticketFilter === 'OPEN') return t.status === 'OPEN';
      if (ticketFilter === 'HIGH') return t.priority === 'High' || t.priority === 'Critical';
      if (ticketFilter === 'ASSIGNED') return t.assignedAgentName && t.assignedAgentName !== 'Unassigned';
      return true;
    });
  }, [safeTickets, ticketFilter]);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.description) return;
    try {
      setLoading(true);
      await createTicket({ ...ticketForm, requesterId: user?.id || 1 }, user?.roleId || 1);
      setTicketForm({ title: '', description: '', priority: 'Medium', category: 'Hardware' });
      await loadData();
    } catch (err) {
      console.error("Failed to submit ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateTicketStatus(id, newStatus, user?.roleId);
      await loadData();
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handlePriorityChange = async (id, newPriority) => {
    try {
      await updateTicketPriority(id, newPriority, user?.roleId);
      await loadData();
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket(prev => ({ ...prev, priority: newPriority }));
      }
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const handleAgentAssign = async (id, agentName) => {
    try {
      await assignTicketAgent(id, agentName, user?.roleId);
      await loadData();
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket(prev => ({ ...prev, assignedAgentName: agentName }));
      }
    } catch (err) {
      console.error("Failed to assign agent:", err);
    }
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!assetForm.assetTag || !assetForm.brand) return;
    try {
      setLoading(true);
      await createAsset({ ...assetForm, serialNumber: assetForm.assetTag + '-SN' }, user?.roleId);
      setAssetForm({ assetTag: '', assetType: 'Laptop', brand: '', model: '', location: '', status: 'Available' });
      await loadData();
    } catch (err) {
      console.error("Failed to register asset:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetStatusChange = async (id, newStatus) => {
    try {
      await updateAssetStatus(id, newStatus);
      await loadData();
    } catch (err) {
      console.error("Failed to update asset status:", err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedTicket(null);
    setActiveTab('tickets');
  };

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(loggedInUser) => {
          setUser(loggedInUser);
        }}
      />
    );
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={handleLogout} />

      {/* Live Metric Cards driven by Report Service */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <MetricCard label="TOTAL TICKETS" value={ticketSummary.totalTickets} color="#2563eb" percent={100} />
        <MetricCard label="OPEN TICKETS" value={ticketSummary.openTickets} color="#f97316" percent={ticketSummary.totalTickets ? (ticketSummary.openTickets / ticketSummary.totalTickets) * 100 : 0} />
        <MetricCard label="SLA COMPLIANCE" value={slaMetrics.complianceRate} color="#10b981" percent={100} />
        <MetricCard label="REGISTERED ASSETS" value={assetSummary.totalAssets} color="#8b5cf6" percent={100} />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['tickets', 'assets', 'knowledge'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? '#2563eb' : 'white',
              color: activeTab === tab ? 'white' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'tickets' && `IT Tickets (${safeTickets.length})`}
            {tab === 'assets' && `Asset Inventory (${safeAssets.length})`}
            {tab === 'knowledge' && `Knowledge Base (${safeArticles.length})`}
          </button>
        ))}
      </div>

      {/* Content Tabs */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>Raise New IT Ticket</h3>
            <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="Issue Title"
                value={ticketForm.title}
                onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
              <textarea
                placeholder="Describe your issue in detail..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                required
                rows="4"
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
              <select
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical Priority</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                style={{ background: '#2563eb', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Active Queue ({filteredTickets.length})</h3>
              <FilterPills activeFilter={ticketFilter} onSelect={setTicketFilter} />
            </div>

            {filteredTickets.length === 0 ? (
              <div style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                No tickets found for this filter segment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    style={{ background: 'white', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'border 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{t.ticketNumber}: {t.title}</span>
                      <span style={{
                        fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '700',
                        background: t.status === 'RESOLVED' ? '#dcfce7' : t.status === 'IN PROGRESS' ? '#ffedd5' : '#fee2e2',
                        color: t.status === 'RESOLVED' ? '#166534' : t.status === 'IN PROGRESS' ? '#c2410c' : '#b91c1c'
                      }}>
                        {t.status}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 12px 0', color: '#64748b', fontSize: '13px', lineHeight: '1.4' }}>{t.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b' }}>
                      <span>Agent: <strong style={{ color: '#334155' }}>{t.assignedAgentName || 'Unassigned'}</strong></span>
                      <span style={{ color: '#2563eb', fontWeight: '600' }}>View Details →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <AssetInventoryTab
          assets={safeAssets}
          assetForm={assetForm}
          setAssetForm={setAssetForm}
          onAssetSubmit={handleAssetSubmit}
          onStatusChange={handleAssetStatusChange}
          loading={loading}
        />
      )}

      {activeTab === 'knowledge' && (
        <KnowledgeBaseTab articles={safeArticles} />
      )}

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          user={user}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onAgentAssign={handleAgentAssign}
        />
      )}
    </div>
  );
}

export default App;