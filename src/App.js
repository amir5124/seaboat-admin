import React from "react";
import { BrowserRouter as Router, Route, Switch, Link, Redirect } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Boats from "./components/Boats";
import Trips from "./components/Trips";
import Seats from "./components/Seats";
import Agen from "./components/Agen"
import { FaTachometerAlt, FaShip, FaRoute, FaChair, FaUser } from "react-icons/fa";

function App() {
  return (
    <Router>

      <div className="d-flex">

        {/* Sidebar */}
        <div className="bg-dark text-white p-3" style={{ minHeight: "100vh", width: "250px" }}>
          <h4>Maruti Admin</h4>
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/">
                <FaTachometerAlt className="me-2" />    Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/boats">
                <FaShip className="me-2" />    Kapal
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/trips">
                <FaRoute className="me-2" />    Trip
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/seats">
                <FaChair className="me-2" />    Kursi
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/agen">
                <FaUser className="me-2" />    Agen
              </Link>
            </li>
          </ul>
        </div>

        {/* Content */}
        <div className="flex-grow-1 p-4">
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <Route path="/boats" component={Boats} />
            <Route path="/trips" component={Trips} />
            <Route path="/seats" component={Seats} />
            <Route path="/agen" component={Agen} />
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App;
