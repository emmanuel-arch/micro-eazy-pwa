import React, { useState } from "react";

const Terms = () => {

  return (
    <div className="container p-3">
      {/* <h3 className="font-bold text-center mb-6">MICROMART AFRICA TERMS AND CONDITIONS</h3> */}
      {[
        {
          title: "1. Repayment Terms",
          text: "Loans shall be repaid as per the agreed loan terms or scheduled installments without any delayed payment."
        },
        {
          title: "2. Prepayment",
          text: "The Borrower has the right to prepay the full outstanding amount at any time. If the Borrower does so, or if the loan is restructured (i.e., replaced by a new facility), the new loan installment will be recalculated accordingly."
        },
        {
          title: "3. Late Payment Charges",
          text: "Any installment not paid within the specified time of its due date shall attract a late fee of 20% on the overdue amount, not to exceed the outstanding principal due for such installment."
        },
        {
          title: "4. Default",
          text: "If the Borrower fails to make any payment on time, the Borrower will be in default. The Lender may then demand immediate repayment of the entire remaining unpaid balance without further notice. If the loan is not settled in full upon the final due date, the Lender reserves the right to impound and auction the pledged security through a private process."
        },
        {
          title: "5. Right of Offset",
          text: "In the event of loan delinquency, the Lender may recover the amount from any security or account held by the Borrower without prior notice. Extension of repayment time does not affect the Borrower’s obligation to repay the full loan."
        },
        {
          title: "6. Collection Fees",
          text: "If this agreement is referred to an attorney or collection agents assigned for collection, the Borrower agrees to pay legal fees as provided under the Advocates Remuneration Act or as advised by the attorney or collection agent. These fees will be added to the outstanding loan balance."
        },
        {
          title: "7. Notice to Borrow",
          text: "This agreement shall serve as the Borrower’s formal request to borrow and an agreement to any future loan continuations."
        },
        {
          title: "8. Borrower Instructions and Authorizations",
          text: (
            <ul className="list-disc ml-6">
              <li>The Borrower irrevocably authorizes the Lender to act on all requests submitted through the system.</li>
              <li>The Lender may decline any request at its sole discretion.</li>
              <li>The Lender may request additional verification before proceeding.</li>
              <li>The Borrower shall not hold the Lender liable for unauthorized access or use of their credentials, unless due to gross negligence by the Lender.</li>
              <li>The Lender is authorized to act in accordance with any lawful order or directive.</li>
            </ul>
          )
        },
        {
          title: "9. Loan Disbursement",
          text: (
            <ul className="list-disc ml-6">
              <li>The approved loan amount shall be credited to the Borrower’s designated account.</li>
              <li>Disbursed amounts may be net of any applicable fees or interest.</li>
              <li>Funds shall be considered disbursed once transferred to the Borrower’s account.</li>
            </ul>
          )
        },
        {
          title: "10. Termination",
          text: (
            <ul className="list-disc ml-6">
              <li>All accrued fees must be settled on the termination date.</li>
              <li>The Borrower shall repay any outstanding principal as of the termination date.</li>
              <li>The Lender may terminate this facility at any time without notice, which shall constitute the effective termination date.</li>
            </ul>
          )
        },
        {
          title: "11. Right to Share Information",
          text: (
            <>
              <p>The Borrower consents and authorizes the Lender to share their credit information, repayment history, and any other relevant data with:</p>
              <ul className="list-disc ml-6">
                <li>Licensed Credit Reference Bureaus (CRBs);</li>
                <li>Collection agents and attorneys for recovery purposes;</li>
                <li>Regulatory authorities as required by law; and</li>
                <li>Any other financial institution or partner for credit assessment, reporting, or fraud prevention.</li>
              </ul>
              <p className="mt-2">This consent remains valid throughout the loan term and for a period thereafter as may be necessary for record keeping or collections.</p>
              <p className="mt-2">By entering into this agreement, I authorize Micromart Africa Ltd to access and query my credit information from any of the licensed CRBs and to receive credit reports/scores from any of the licensed CRBs on my behalf in order to assess my creditworthiness, both at the time of application and during the duration of the facility. I further consent to my credit information being shared with the licensed CRBs. This consent shall not be withdrawn during the period in which my application is pending or while I have an outstanding balance.</p>
            </>
          )
        }
      ].map((section, idx) => (
        <div key={idx} className="mb-6">
          <h5 className="font-bold">{section.title}</h5>
          <div className="mt-1">{section.text}</div>
        </div>
      ))}

      <footer className="text-center text-sm text-gray-600 mt-12 border-t pt-4">
        <p>Casamia, Ngong Road, Nairobi | P.O. Box 1864-00100 Nairobi | Phone: +254 20 2 736 622</p>
        <p>Email: <a target="_blank" href="mailto:info@micromartafrica.com" className="text-blue-600">info@micromartafrica.com</a> | Web: <a target="_blank" href="http://micromartafrica.com" className="text-blue-600">http://micromartafrica.com</a></p>
      </footer>
    </div>
  );
};

export default Terms;