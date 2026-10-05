import { API_BASE_URL } from '../config/api';

/**
 * Official Real API Client for RescueNet Platform
 * Operates purely on live production FastAPI endpoints and PostgreSQL database without fake data.
 */

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const response = await fetch(url, {
      ...options,
      headers: { ...getAuthHeaders(isFormData), ...options.headers }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
      let errDetail = `API Error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.detail) {
          errDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (e) {
        // use status text
      }
      throw new Error(errDetail);
    }
    return await response.json();
  },

  // 1. AI Detection & File Upload
  async detectAnimal(formData) {
    return await this.request('/reports/detect-ai', {
      method: 'POST',
      body: formData
    });
  },

  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    return await this.request('/reports/upload', {
      method: 'POST',
      body: formData
    });
  },

  // 2. Duplicate Check
  async checkDuplicates({ latitude, longitude, animal_type }) {
    return await this.request('/reports/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, animal_type })
    });
  },

  // 3. Submit Complaint
  async submitReport(reportData) {
    return await this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  },

  // 4. Get Reports (My Reports / All Reports)
  async getMyReports() {
    return await this.request('/reports/my-reports');
  },

  async getAllReports() {
    return await this.request('/reports');
  },

  // 5. Community Feed & Sightings
  async getFeedSightings(zone = 'Dombivli East - Station & Ramnagar') {
    return await this.request(`/feed/sightings?zone=${encodeURIComponent(zone)}`);
  },

  async createSighting(sightingData) {
    return await this.request('/feed/sighting', {
      method: 'POST',
      body: JSON.stringify(sightingData)
    });
  },

  async corroborateSighting(sightingId) {
    return await this.request('/feed/corroborate', {
      method: 'POST',
      body: JSON.stringify({ sighting_id: sightingId })
    });
  },

  // 6. Adoptions
  async getAdoptions() {
    return await this.request('/adoptions');
  },

  async createAdoptionListing(listingData) {
    return await this.request('/adoptions/create', {
      method: 'POST',
      body: JSON.stringify(listingData)
    });
  },

  async applyAdoption(applicationData) {
    return await this.request('/adoptions/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });
  },

  async getMyAdoptionApplications() {
    return await this.request('/adoptions/my-applications');
  },

  // 7. Volunteer Workstation
  async getVolunteerTasks() {
    return await this.request('/volunteer/tasks');
  },

  async completeVolunteerTask({ task_id, completion_photo, resolution_notes }) {
    return await this.request('/volunteer/complete-task', {
      method: 'POST',
      body: JSON.stringify({ task_id, completion_photo, resolution_notes })
    });
  },

  // 8. Officer & NGO Management
  async getOfficerComplaints() {
    return await this.request('/officer/complaints');
  },

  async getVolunteersList() {
    return await this.request('/officer/volunteers');
  },

  async assignVolunteer({ complaint_id, volunteer_name, volunteer_id, instructions }) {
    return await this.request('/officer/assign', {
      method: 'POST',
      body: JSON.stringify({ complaint_id, volunteer_name, volunteer_id, instructions })
    });
  },

  async updateComplaintStatus({ complaint_id, status }) {
    return await this.request('/officer/update-status', {
      method: 'POST',
      body: JSON.stringify({ complaint_id, status })
    });
  },

  // 9. Video Verification
  async verifyVideoFrame(imageDataUrl, caseId = null) {
    return await this.request('/officer/verify-video', {
      method: 'POST',
      body: JSON.stringify({ frame: imageDataUrl, case_id: caseId })
    });
  },

  // 10. Analytics & Donations
  async getAnalyticsOverview() {
    return await this.request('/analytics/overview');
  },

  async createDonationCheckout(donationData) {
    return await this.request('/donations/checkout', {
      method: 'POST',
      body: JSON.stringify(donationData)
    });
  },

  async getDonationLedger() {
    return await this.request('/donations/ledger');
  },

  // 11. Cruelty & SOS
  async reportCruelty(crueltyData) {
    return await this.request('/cruelty/report', {
      method: 'POST',
      body: JSON.stringify(crueltyData)
    });
  },

  async triggerSOS(sosData) {
    return await this.request('/sos/trigger', {
      method: 'POST',
      body: JSON.stringify(sosData)
    });
  },

  async getLeaderboard() {
    return await this.request('/gamification/leaderboard');
  },

  // 12. Notifications
  async getNotifications() {
    return await this.request('/notifications');
  },

  async markNotificationRead(id) {
    return await this.request(`/notifications/${id}/read`, {
      method: 'POST'
    });
  }
};
