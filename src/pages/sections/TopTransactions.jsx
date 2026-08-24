import React from 'react';

const transactionsData = [
  {
    id: 1,
    loanName: 'Home loan 1',
    dueDate: '25 July 2025',
    amount: '450.00',
    status: 'Upcoming',
    type: 'due',
  },
  {
    id: 2,
    loanName: 'Home loan 2',
    dueDate: '15 July 2025',
    amount: '530.00',
    status: 'Upcoming',
    type: 'due',
  },
  {
    id: 3,
    loanName: 'Home loan 3',
    dueDate: '12 July 2025',
    amount: '450.00',
    status: 'Upcoming',
    type: 'due',
  },
  {
    id: 4,
    loanName: 'Home loan 1',
    dueDate: '25 June 2025, 12:50 PM',
    amount: '450.00',
    type: 'paid',
  },
  {
    id: 5,
    loanName: 'Home loan 2',
    dueDate: '15 June 2025, 12:50 PM',
    amount: '530.00',
    type: 'paid',
  },
  {
    id: 6,
    loanName: 'Home loan 3',
    dueDate: '12 June 2025, 12:50 PM',
    amount: '450.00',
    type: 'paid',
  },
];

function TopTransactions() {
  return (
    <div className="card adminuiux-card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h6>Transactions</h6>
          </div>
          <div className="col-auto">
            <button className="btn btn-sm btn-outline-theme">
                All<i className="bi bi-arrow-up-right me-1"></i>
            </button>
          </div>
        </div>
      </div>
      <ul className="list-group list-group-flush border-top bg-none">
        {transactionsData.map((transaction) => (
          <li className="list-group-item" key={transaction.id}>
            <div className="row gx-3 align-items-center">
              {transaction.type === 'due' ? (
                <>
                  <div className="col">
                    <p className="mb-1 fw-medium">{transaction.loanName}</p>
                    <p className="text-secondary small">{transaction.dueDate}</p>
                  </div>
                  <div className="col-auto text-end">
                    <h6 className="text-success">$ {transaction.amount}</h6>
                    <div className="badge badge-sm badge-light text-bg-warning">
                      {transaction.status}
                    </div>
                  </div>
                  <div className="col-auto">
                    <button className="avatar avatar-40 rounded-circle border border-theme-1 bg-theme-1-subtle text-theme-1">
                      <i className="bi bi-arrow-up-right h5"></i>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-auto">
                    <div className="avatar avatar-40 rounded-circle border">
                      <i className="bi bi-arrow-up-right h5"></i>
                    </div>
                  </div>
                  <div className="col">
                    <p className="mb-1 fw-medium">{transaction.loanName}</p>
                    <p className="text-secondary small">{transaction.dueDate}</p>
                  </div>
                  <div className="col-auto">
                    <h6>- $ {transaction.amount}</h6>
                  </div>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TopTransactions;