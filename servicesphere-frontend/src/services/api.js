import axios from 'axios';

// Hardcoded to ensure the /api prefix is never omitted by environment variables
const API_BASE_URL = 'https://service-sphere1.onrender.com/api';

const handleRequest = async (apiCall) => {
    try {
        const response = await apiCall();
        return response.data;
    } catch (error) {
        const data = error.response?.data;
        let message = data?.error || data?.message || error.message;

        if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
            const details = Object.values(data.fieldErrors).filter(Boolean).join(', ');
            if (details) {
                message = `${message}: ${details}`;
            }
        }

        throw new Error(message);
    }
};

// --- Authentication ---
export const loginUser = (credentials) => handleRequest(() => axios.post(`${API_BASE_URL}/login`, credentials));
export const registerUser = (userData) => handleRequest(() => axios.post(`${API_BASE_URL}/register`, userData));
export const logoutUser = () => handleRequest(() => axios.post(`${API_BASE_URL}/logout`));
export const getCurrentUser = (email) => handleRequest(() => axios.get(`${API_BASE_URL}/auth/me`, { params: { email } }));
export const getDepartments = () => handleRequest(() => axios.get(`${API_BASE_URL}/departments`));

// --- Tickets ---
export const getTickets = (params) => handleRequest(() => axios.get(`${API_BASE_URL}/tickets`, { params }));
export const createTicket = (ticketData, roleId) => handleRequest(() => axios.post(`${API_BASE_URL}/tickets`, ticketData, { params: { roleId } }));
export const updateTicketStatus = (id, status, roleId) => handleRequest(() => axios.patch(`${API_BASE_URL}/tickets/${id}/status`, null, { params: { status, roleId } }));
export const updateTicketPriority = (id, priority, roleId) => handleRequest(() => axios.patch(`${API_BASE_URL}/tickets/${id}/priority`, null, { params: { priority, roleId } }));
export const assignTicketAgent = (id, agentName, roleId) => handleRequest(() => axios.patch(`${API_BASE_URL}/tickets/${id}/assign`, null, { params: { agent: agentName, roleId } }));
export const escalateTicket = (id, newPriority, reason, roleId) => handleRequest(() => axios.patch(`${API_BASE_URL}/tickets/${id}/escalate`, null, { params: { newPriority, reason, roleId } }));
export const archiveTicket = (id, roleId) => handleRequest(() => axios.patch(`${API_BASE_URL}/tickets/${id}/archive`, null, { params: { roleId } }));

// Comments & Audit History
export const getTicketComments = (ticketId) => handleRequest(() => axios.get(`${API_BASE_URL}/tickets/${ticketId}/comments`));
export const addTicketComment = (ticketId, commentData) => handleRequest(() => axios.post(`${API_BASE_URL}/tickets/${ticketId}/comments`, commentData));
export const getTicketHistory = (ticketId) => handleRequest(() => axios.get(`${API_BASE_URL}/tickets/${ticketId}/history`));

// --- Assets ---
export const getAssets = () => handleRequest(() => axios.get(`${API_BASE_URL}/assets`));
export const createAsset = (assetData, roleId) => handleRequest(() => axios.post(`${API_BASE_URL}/assets`, assetData, { params: { roleId } }));
export const updateAssetStatus = (id, status) => handleRequest(() => axios.patch(`${API_BASE_URL}/assets/${id}/status`, null, { params: { status } }));

// --- Knowledge Base ---
export const getKnowledgeArticles = (params) => handleRequest(() => axios.get(`${API_BASE_URL}/kb`, { params }));
export const createKnowledgeArticle = (articleData, roleId) =>
    handleRequest(() => axios.post(`${API_BASE_URL}/kb`, articleData, { params: { roleId } }));
export const updateKnowledgeArticle = (id, articleData, roleId) =>
    handleRequest(() => axios.put(`${API_BASE_URL}/kb/${id}`, articleData, { params: { roleId } }));
export const updateKnowledgeArticleStatus = (id, status, roleId) =>
    handleRequest(() => axios.patch(`${API_BASE_URL}/kb/${id}/status`, null, { params: { status, roleId } }));

// --- Live Reports ---
export const reportService = {
    getTicketSummary: () => handleRequest(() => axios.get(`${API_BASE_URL}/reports/tickets/summary`)),
    getSlaMetrics: () => handleRequest(() => axios.get(`${API_BASE_URL}/reports/sla`)),
    getAssetSummary: () => handleRequest(() => axios.get(`${API_BASE_URL}/reports/assets/summary`)),
    getAgentWorkload: () => handleRequest(() => axios.get(`${API_BASE_URL}/reports/agent-workload`))
};