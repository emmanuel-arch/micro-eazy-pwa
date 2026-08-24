import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="adminuiux-footer has-adminuiux-sidebar mt-auto">
        <div className="container-fluid">
            <div className="row">
            <div className="col-12 col-md col-lg py-2"><span className="small">Copyright @2025, Powered by <a href="https://techcrast.co.ke" target="_blank">TechCrast LTD</a></span></div>
            <div className="col-12 col-md-auto col-lg-auto align-self-center">
                <ul className="nav small">
                <li className="nav-item"><a className="nav-link" href="help-center.html">Help</a></li>
                <li className="nav-item">|</li>
                <li className="nav-item"><a className="nav-link" href="terms-of-use.html">Terms of Use</a></li>
                <li className="nav-item">|</li>
                <li className="nav-item"><a className="nav-link" href="privacy-policy.html">Privacy Policy</a></li>
                </ul>
            </div>
            </div>
        </div>
    </footer>

  );
}

export default Footer;