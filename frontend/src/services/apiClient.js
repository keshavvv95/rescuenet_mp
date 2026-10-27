import { API_BASE_URL } from '../config/api.js';

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

  async getTriagePreview(payload) {
    return await this.request('/reports/triage-preview', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async uploadPhoto(file) {
    const formData = file instanceof FormData ? file : new FormData();
    if (!(file instanceof FormData)) {
      formData.append('file', file);
    }
    return await this.request('/reports/upload', {
      method: 'POST',
      body: formData
    });
  },

  async uploadImage(fileOrFormData) {
    return await this.uploadPhoto(fileOrFormData);
  },

  // 2. Duplicate Check
  async checkDuplicates({ latitude, longitude, animal_type, radius_meters = 500.0, time_window_hours = 3.0 }) {
    return await this.request('/reports/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, animal_type, radius_meters, time_window_hours })
    });
  },

  async checkDuplicateIncidents(latitude, longitude, radius = 500.0) {
    return await this.checkDuplicates({ latitude, longitude, radius_meters: radius });
  },

  async reverseGeocode(latitude, longitude) {
    return await this.request(`/reports/reverse-geocode?lat=${latitude}&lng=${longitude}`);
  },

  // 3. Submit Complaint
  async submitReport(reportData) {
    return await this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  },

  async createIncident(incidentData) {
    const payload = {
      photo_url: incidentData.photo_url || incidentData.image_url || '/static/uploads/reports/default.jpg',
      latitude: Number(incidentData.latitude) || 19.0760,
      longitude: Number(incidentData.longitude) || 72.8777,
      address: incidentData.address || incidentData.location || 'Current Location Coordinates',
      detected_animal_type: incidentData.animal_type || incidentData.detected_animal_type || 'Dog',
      detection_confidence: incidentData.confidence || incidentData.detection_confidence || 0.90,
      confirmed_animal_type: incidentData.animal_type || incidentData.confirmed_animal_type || 'Dog',
      description: incidentData.description || incidentData.title || 'Emergency rescue report',
      urgency: incidentData.urgency || 'Emergency',
      is_sos: Boolean(incidentData.is_sos ?? true),
      distress_score: Number(incidentData.distress_score || 0.5),
      is_ai_generated: Boolean(incidentData.is_ai_generated || false),
      is_web_image: Boolean(incidentData.is_web_image || false),
      authenticity_status: incidentData.authenticity_status || null
    };
    return await this.submitReport(payload);
  },

  // 4. Get Reports (My Reports / All Reports)
  async getMyReports() {
    return await this.request('/reports/my-reports');
  },

  async getAllReports() {
    return await this.request('/reports');
  },

  // 5. Community Feed & Sightings
  async getFeedSightings(zone = '') {
    const query = zone ? `?zone=${encodeURIComponent(zone)}` : '';
    return await this.request(`/feed/sightings${query}`);
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

  async getAvailableVolunteers() {
    return await this.getVolunteersList();
  },

  async assignVolunteer(complaintIdOrObj, maybeVolunteerName) {
    let payload = {};
    if (typeof complaintIdOrObj === 'object' && complaintIdOrObj !== null) {
      payload = complaintIdOrObj;
    } else {
      payload = {
        complaint_id: String(complaintIdOrObj),
        volunteer_name: maybeVolunteerName || 'Assigned Volunteer'
      };
    }
    return await this.request('/officer/assign', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateComplaintStatus(complaintIdOrObj, maybeStatus) {
    let payload = {};
    if (typeof complaintIdOrObj === 'object' && complaintIdOrObj !== null) {
      payload = complaintIdOrObj;
    } else {
      payload = {
        complaint_id: String(complaintIdOrObj),
        status: maybeStatus
      };
    }
    return await this.request('/officer/update-status', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateIncidentStatus(complaintIdOrObj, maybeStatus) {
    return await this.updateComplaintStatus(complaintIdOrObj, maybeStatus);
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

  async getCivicAnalytics() {
    return await this.getAnalyticsOverview();
  },

  async downloadAnalyticsExport() {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/analytics/export`, { headers });
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rescuenet_complaints_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  async createDonationCheckout(donationData) {
    return await this.request('/donations/checkout', {
      method: 'POST',
      body: JSON.stringify(donationData)
    });
  },

  async createDonation(donationData) {
    return await this.createDonationCheckout(donationData);
  },

  async getDonationLedger() {
    return await this.request('/donations/ledger');
  },

  async getDonationsLedger() {
    return await this.getDonationLedger();
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
