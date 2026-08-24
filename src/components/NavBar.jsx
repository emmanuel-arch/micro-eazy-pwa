import { Link } from 'react-router-dom';

function NavBar() {
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/loans">Loans</Link>
      <Link to="/profile">Profile</Link>
    </nav>
  );
}

export default NavBar;