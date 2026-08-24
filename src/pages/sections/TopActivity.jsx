import React, { useState } from 'react';

const activitiesData = [
  {
    id: 1,
    date: '9 June 2025 11:55 AM',
    description:
      'Application disbursement letter allocated to applicant and email notification has been sent for the same.',
    status: 'Normal',
    color: 'bg-theme-1',
  },
  {
    id: 2,
    date: '7 June 2025 10:15 AM',
    description:
      'EMI received for the loan account: XX-5269. Confirmation message and invoice will be delivered to your inbox in 24 hours.',
    status: 'Better',
    color: 'bg-warning',
  },
  {
    id: 3,
    date: '6 June 2025 5:00 PM',
    description:
      'Application has a updating request for your current address provided in application form. Error code suggest that there may be city code mismatch.',
    status: 'Critical',
    color: 'bg-danger',
  },
  {
    id: 4,
    date: '1 June 2025 11:55 AM',
    description:
      'EMI received for the loan account: XX-1211. Confirmation message and invoice will be delivered to your inbox in 24 hours.',
    status: 'Normal',
    color: 'bg-theme-1',
  },
  // Add more activity items as needed
];

function TopActivity() {
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const filteredActivities =
    selectedStatus === 'All Status'
      ? activitiesData
      : activitiesData.filter((activity) => activity.description.includes(selectedStatus.split(' ')[1]));

  return (
    <div className="card adminuiux-card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h6>Updates</h6>
          </div>
          <div className="col-auto">
            <button className="btn btn-sm btn-outline-theme">
                All<i className="bi bi-arrow-up-right me-1"></i>
            </button>
          </div>
        </div>
      </div>
      <div
        className="card-body height-dynamic overflow-y-auto"
        style={{ '--h-dynamic': '410px' }}
      >
        <ul className="timeline circle">
          {filteredActivities.map((activity) => (
            <li key={activity.id}>
              <span
                className={`circle-dot ${activity.color}`}
                data-bs-toggle="tooltip"
                aria-label={activity.status}
                data-bs-original-title={activity.status}
              ></span>
              <div>
                <p className="h6 mb-2">{activity.date}</p>
                <p className="text-secondary small">{activity.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TopActivity;