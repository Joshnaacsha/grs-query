import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/WaterBoard.css";
import NavBar_Departments from "../components/NavBar_Departments";
import { useAuth } from "../context/AuthContext";
import { FaSearch, FaUser, FaSignOutAlt, FaCheck, FaPlay, FaCheckCircle, FaClock, FaClipboardList, FaComments, FaTimes, FaEye, FaTools } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ChatComponent from '../components/ChatComponent';
import "../styles/Chat.css";

const WaterDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [grievances, setGrievances] = useState({
    pending: [],
    assigned: [],
    inProgress: [],
    resolved: []
  });
  const [stats, setStats] = useState({
    pending: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    startDate: '',
    endDate: '',
    requirementsNeeded: '',
    fundsRequired: '',
    resourcesRequired: '',
    manpowerNeeded: ''
  });
  const [timelineForm, setTimelineForm] = useState({
    stageName: '',
    date: '',
    description: ''
  });

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-badge pending';
      case 'assigned':
        return 'status-badge assigned';
      case 'in-progress':
        return 'status-badge in-progress';
      case 'resolved':
        return 'status-badge resolved';
      default:
        return 'status-badge';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'priority-badge priority-high';
      case 'medium':
        return 'priority-badge priority-medium';
      case 'low':
        return 'priority-badge priority-low';
      default:
        return 'priority-badge';
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Set user info
    setEmployeeId(user.id);
    setEmail(user.email);

    // Fetch initial data
    fetchGrievances();
  }, [user, activeTab]);

  const analyzePriorityLocally = (grievance) => {
    const description = grievance.description?.toLowerCase() || '';
    const title = grievance.title?.toLowerCase() || '';

    // Keywords indicating high priority for Water department
    const highPriorityKeywords = [
      'urgent', 'emergency', 'immediate', 'critical', 'severe', 'dangerous',
      'contaminated', 'health hazard', 'unsafe water', 'sewage overflow',
      'water pollution', 'toxic', 'no water supply', 'drinking water',
      'water quality', 'pipe burst', 'flooding', 'waterborne disease'
    ];

    // Keywords indicating medium priority
    const mediumPriorityKeywords = [
      'important', 'moderate', 'repair', 'fix', 'maintenance',
      'leakage', 'irregular supply', 'low pressure', 'water meter',
      'billing issue', 'connection problem', 'drainage', 'water testing',
      'tank cleaning', 'chlorination'
    ];

    // Check for high priority keywords
    const hasHighPriority = highPriorityKeywords.some(keyword =>
      description.includes(keyword) || title.includes(keyword)
    );

    // Check for medium priority keywords
    const hasMediumPriority = mediumPriorityKeywords.some(keyword =>
      description.includes(keyword) || title.includes(keyword)
    );

    if (hasHighPriority) {
      return {
        priority: 'High',
        explanation: 'This grievance requires immediate attention due to potential health hazards or critical water supply issues.',
        impactAssessment: 'High impact on public health and essential water services. Immediate action required.',
        recommendedResponseTime: '24-48 hours'
      };
    } else if (hasMediumPriority) {
      return {
        priority: 'Medium',
        explanation: 'This grievance needs attention but is not critical.',
        impactAssessment: 'Moderate impact on water services. Action required within standard timeframe.',
        recommendedResponseTime: '3-5 working days'
      };
    } else {
      return {
        priority: 'Low',
        explanation: 'This is a routine grievance that can be handled through standard procedures.',
        impactAssessment: 'Limited impact on water services. Can be addressed through regular maintenance.',
        recommendedResponseTime: '7-10 working days'
      };
    }
  };

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/grievances/department/Water/${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch grievances');
      }

      const data = await response.json();

      // Process grievances with Gemini AI priority analysis
      const processedGrievances = await Promise.all(data.grievances.map(async (grievance) => {
        try {
          // Call Gemini AI for priority analysis
          const priorityResponse = await fetch('http://localhost:5000/api/grievances/analyze-priority', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: grievance.title || '',
              description: grievance.description || '',
              department: 'Water'
            })
          });

          if (!priorityResponse.ok) {
            throw new Error('Failed to analyze priority');
          }

          const priorityData = await priorityResponse.json();

          return {
            ...grievance,
            grievanceId: grievance.petitionId || grievance.grievanceId || 'N/A',
            title: grievance.title || 'No Title',
            description: grievance.description || 'No Description',
            createdAt: grievance.createdAt || new Date().toISOString(),
            priority: priorityData.priority,
            priorityExplanation: priorityData.priorityExplanation,
            impactAssessment: priorityData.impactAssessment,
            recommendedResponseTime: priorityData.recommendedResponseTime
          };
        } catch (error) {
          console.error('Error analyzing priority:', error);
          // Fallback to local analysis if Gemini fails
          const localPriorityData = analyzePriorityLocally(grievance);
          return {
            ...grievance,
            grievanceId: grievance.petitionId || grievance.grievanceId || 'N/A',
            title: grievance.title || 'No Title',
            description: grievance.description || 'No Description',
            createdAt: grievance.createdAt || new Date().toISOString(),
            priority: localPriorityData.priority,
            priorityExplanation: localPriorityData.explanation,
            impactAssessment: localPriorityData.impactAssessment,
            recommendedResponseTime: localPriorityData.recommendedResponseTime
          };
        }
      }));

      setGrievances(prev => ({
        ...prev,
        [activeTab]: processedGrievances
      }));

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching grievances:', error);
      setError('Failed to load grievances. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (grievance) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/grievances/${grievance._id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to accept grievance');
      }

      // Refresh data
      fetchGrievances();
      setActiveTab('assigned');
      toast.success('Grievance accepted successfully');
    } catch (error) {
      console.error('Error accepting grievance:', error);
      toast.error('Failed to accept grievance');
    }
  };

  const handleResourceSubmit = async (grievanceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`http://localhost:5000/api/grievances/${grievanceId}/resource-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resourceForm)
      });

      if (!response.ok) throw new Error('Failed to submit resource management');

      setShowResourceModal(false);
      toast.success('Resource management details submitted successfully');

      // Automatically start progress after resource management submission
      await handleStartProgress(grievanceId);

      fetchGrievances();
    } catch (error) {
      console.error('Error submitting resource management:', error);
      toast.error('Failed to submit resource management details');
    }
  };

  const handleTimelineSubmit = async (grievanceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`http://localhost:5000/api/grievances/${grievanceId}/timeline-stage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timelineForm)
      });

      if (!response.ok) throw new Error('Failed to update timeline');

      setShowTimelineModal(false);
      toast.success('Timeline updated successfully');
      fetchGrievances();
    } catch (error) {
      console.error('Error updating timeline:', error);
      toast.error('Failed to update timeline');
    }
  };

  const handleStartProgress = async (grievanceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/grievances/${grievanceId}/start-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: 'Starting progress on grievance' })
      });

      if (!response.ok) {
        throw new Error('Failed to start progress');
      }

      // Refresh data
      fetchGrievances();
      setActiveTab('inProgress');
    } catch (error) {
      console.error('Error starting progress:', error);
      setError('Failed to start progress');
    }
  };

  const handleResolve = async (grievanceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.jpg,.jpeg,.png';
      fileInput.onchange = async (e) => {
        try {
          const file = e.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('document', file);

          // First upload the document
          const uploadResponse = await fetch(`http://localhost:5000/api/grievances/${grievanceId}/upload-resolution`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData
          });

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok) {
            throw new Error(uploadData.error || 'Failed to upload resolution document');
          }

          // Then resolve the grievance
          const resolveResponse = await fetch(`http://localhost:5000/api/grievances/${grievanceId}/resolve`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              resolutionMessage: 'Grievance resolved with attached document'
            })
          });

          const resolveData = await resolveResponse.json();

          if (!resolveResponse.ok) {
            throw new Error(resolveData.error || 'Failed to resolve grievance');
          }

          // Refresh the grievances list
          fetchGrievances();
          toast.success('Grievance resolved successfully');
        } catch (error) {
          console.error('Error in file upload:', error);
          toast.error(error.message || 'Failed to upload and resolve grievance');
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('Error resolving grievance:', error);
      toast.error(error.message || 'Failed to resolve grievance');
    }
  };

  const handleDecline = async (grievance) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/grievances/${grievance._id}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: declineReason })
      });

      if (!response.ok) {
        throw new Error('Failed to decline grievance');
      }

      setShowDeclineModal(false);
      setDeclineReason("");
      fetchGrievances();
      setSelectedGrievance(null);
    } catch (error) {
      console.error('Error declining grievance:', error);
      setError('Failed to decline grievance. Please try again.');
    }
  };

  const handleViewChat = (grievance) => {
    setSelectedGrievance(grievance);
    setShowChat(true);
  };

  const filteredGrievances = grievances[activeTab].filter(grievance =>
    (grievance?.petitionId?.toLowerCase() || grievance?.grievanceId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (grievance?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const renderDetailsModal = () => {
    if (!selectedGrievance) return null;
    return (
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Grievance Details</h2>
              <p className="text-sm text-gray-500 mt-1">ID: {selectedGrievance.grievanceId}</p>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full p-2 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="modal-body space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Priority Analysis</h3>
                <span className={getPriorityBadgeClass(selectedGrievance.priority)}>
                  {selectedGrievance.priority || 'Not set'}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {selectedGrievance.priorityExplanation || 'Priority explanation not available'}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Assessment</h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedGrievance.impactAssessment || 'Impact assessment not available'}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Response Time</h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedGrievance.recommendedResponseTime || 'Standard response time'}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedGrievance.location || 'Location details not available'}
              </p>
            </div>

            {selectedGrievance.assignedTo && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Personnel</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUser className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedGrievance.assignedTo.firstName} {selectedGrievance.assignedTo.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selectedGrievance.assignedTo.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              onClick={() => setShowDetails(false)}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGrievanceCard = (grievance) => {
    return (
      <div key={grievance._id} className="grievance-card">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{grievance.title}</h3>
              <span className={getPriorityBadgeClass(grievance.priority)}>
                {grievance.priority || 'Not set'}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="flex items-center gap-2">
                <span className="font-medium">ID:</span> {grievance.grievanceId}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Created:</span> {new Date(grievance.createdAt).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <span className={getStatusBadgeClass(grievance.status)}>{grievance.status}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedGrievance(grievance);
                setShowDetails(true);
              }}
              className="btn btn-primary"
            >
              <FaEye className="mr-2" /> View Details
            </button>
            <button
              onClick={() => handleViewChat(grievance)}
              className="btn btn-secondary"
            >
              <FaComments className="mr-2" /> Chat
            </button>
          </div>
        </div>
        <p className="text-gray-700 mb-4 line-clamp-2">{grievance.description}</p>
        <div className="flex justify-end gap-2">
          {activeTab === 'pending' && (
            <>
              <button
                onClick={() => handleAccept(grievance)}
                className="btn btn-success"
              >
                <FaCheck className="mr-2" /> Accept
              </button>
              <button
                onClick={() => {
                  setSelectedGrievance(grievance);
                  setShowDeclineModal(true);
                }}
                className="btn btn-danger"
              >
                <FaTimes className="mr-2" /> Decline
              </button>
            </>
          )}
          {activeTab === 'assigned' && (
            <button
              onClick={() => {
                setSelectedGrievance(grievance);
                setShowResourceModal(true);
              }}
              className="btn btn-primary"
            >
              <FaTools className="mr-2" /> Resource Management
            </button>
          )}
          {activeTab === 'inProgress' && (
            <>
              <button
                onClick={() => {
                  setSelectedGrievance(grievance);
                  setShowTimelineModal(true);
                }}
                className="btn btn-primary"
              >
                <FaClock className="mr-2" /> Update Timeline
              </button>
              <button
                onClick={() => handleResolve(grievance._id)}
                className="btn btn-success"
              >
                <FaCheckCircle className="mr-2" /> Mark as Resolved
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <NavBar_Departments />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="logo-section">
            <h2>Water Department</h2>
          </div>
          <div className="user-section">
            <span>{employeeId} - {email}</span>
          </div>
        </header>

        <div className="content-area">
          <aside className="sidebar">
            <div className="menu-item active">
              <span className="icon">📋</span>
              <span>Grievances</span>
            </div>
            <div className="menu-item">
              <span className="icon">📊</span>
              <span>Reports</span>
            </div>
            <div className="menu-item">
              <span className="icon">⚙️</span>
              <span>Settings</span>
            </div>
            <div className="menu-item" onClick={logout}>
              <span className="icon">🚪</span>
              <span>Logout</span>
            </div>
          </aside>

          <main className="main-content">
            <div className="page-header">
              <h1>Grievances</h1>
              <div className="stats-bar">
                <div className="stat-item">
                  <span>Pending:</span>
                  <span className="stat-number">{stats.pending}</span>
                </div>
                <div className="stat-item">
                  <span>Assigned:</span>
                  <span className="stat-number">{stats.assigned}</span>
                </div>
                <div className="stat-item">
                  <span>In Progress:</span>
                  <span className="stat-number">{stats.inProgress}</span>
                </div>
                <div className="stat-item">
                  <span>Resolved:</span>
                  <span className="stat-number">{stats.resolved}</span>
                </div>
              </div>
            </div>

            <div className="tab-container">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === "pending" ? "active" : ""}`}
                  onClick={() => setActiveTab("pending")}
                >
                  Pending
                </button>
                <button
                  className={`tab ${activeTab === "assigned" ? "active" : ""}`}
                  onClick={() => setActiveTab("assigned")}
                >
                  Assigned
                </button>
                <button
                  className={`tab ${activeTab === "inProgress" ? "active" : ""}`}
                  onClick={() => setActiveTab("inProgress")}
                >
                  In Progress
                </button>
                <button
                  className={`tab ${activeTab === "resolved" ? "active" : ""}`}
                  onClick={() => setActiveTab("resolved")}
                >
                  Resolved
                </button>
              </div>

              <div className="search-container">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="grievances-list">
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : error ? (
                  <div className="error">{error}</div>
                ) : grievances[activeTab].length === 0 ? (
                  <div className="no-grievances">No grievances found</div>
                ) : (
                  grievances[activeTab].map((grievance) => renderGrievanceCard(grievance))
                )}
              </div>
            </div>
          </main>

          {showDetails && renderDetailsModal()}
        </div>
      </div>

      {showDeclineModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Decline Grievance</h3>
            <textarea
              placeholder="Enter reason for declining..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDecline(selectedGrievance)}
                disabled={!declineReason.trim()}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}


      {showResourceModal && selectedGrievance && (
        <div className="modal">
          <div className="modal-content">
            <h3>Resource Management</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleResourceSubmit(selectedGrievance._id);
            }}>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={resourceForm.startDate}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={resourceForm.endDate}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Requirements Needed</label>
                <textarea
                  value={resourceForm.requirementsNeeded}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, requirementsNeeded: e.target.value }))}
                  required
                  placeholder="List all requirements"
                />
              </div>
              <div className="form-group">
                <label>Funds Required (₹)</label>
                <input
                  type="number"
                  value={resourceForm.fundsRequired}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, fundsRequired: e.target.value }))}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Resources Required</label>
                <textarea
                  value={resourceForm.resourcesRequired}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, resourcesRequired: e.target.value }))}
                  required
                  placeholder="List all resources"
                />
              </div>
              <div className="form-group">
                <label>Manpower Needed</label>
                <input
                  type="number"
                  value={resourceForm.manpowerNeeded}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, manpowerNeeded: e.target.value }))}
                  required
                  min="0"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowResourceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTimelineModal && selectedGrievance && (
        <div className="modal">
          <div className="modal-content">
            <h3>Update Timeline</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleTimelineSubmit(selectedGrievance._id);
            }}>
              <div className="form-group">
                <label>Stage</label>
                <select
                  value={timelineForm.stageName}
                  onChange={(e) => setTimelineForm(prev => ({ ...prev, stageName: e.target.value }))}
                  required
                >
                  <option value="">Select Stage</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Investigation">Investigation</option>
                  <option value="Resolution">Resolution</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={timelineForm.date}
                  onChange={(e) => setTimelineForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={timelineForm.description}
                  onChange={(e) => setTimelineForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                  placeholder="Example: Gathered evidence from site visit"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTimelineModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChat && selectedGrievance && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Chat - Grievance {selectedGrievance.grievanceId}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowChat(false);
                    setSelectedGrievance(null);
                  }}
                ></button>
              </div>
              <div className="modal-body" style={{ height: '500px', padding: 0 }}>
                <ChatComponent
                  grievanceId={selectedGrievance._id}
                  petitionerId={selectedGrievance.petitioner?._id || selectedGrievance.petitioner}
                  officialId={user.id}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterDashboard;