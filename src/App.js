import React from "react";
import { BrowserRouter as Router, Route, Switch, Link, Redirect } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Boats from "./components/Boats";
import Trips from "./components/Trips";
import Seats from "./components/Seats";



function App() {
  return (
    <Router>

      <div className="d-flex">

        {/* Sidebar */}
        <div className="bg-dark text-white p-3" style={{ minHeight: "100vh", width: "250px" }}>
          <h4>Maruti Admin</h4>
          <ul className="nav flex-column">
            {/* <li className="nav-item"><Link className="nav-link text-white" to="/">Dashboard</Link></li> */}
            <li className="nav-item"><Link className="nav-link text-white" to="/boats">Kapal</Link></li>
            <li className="nav-item"><Link className="nav-link text-white" to="/trips">Trip</Link></li>
            <li className="nav-item"><Link className="nav-link text-white" to="/seats">Kursi</Link></li>
          </ul>
        </div>

        {/* Content */}
        <div className="flex-grow-1 p-4">
          <Switch>
            {/* Redirect root "/" ke "/boats" */}
            <Route path="/" exact>
              <Redirect to="/boats" />
            </Route>

            <Route path="/boats" component={Boats} />
            <Route path="/trips" component={Trips} />
            <Route path="/seats" component={Seats} />
            <Route path="/dashboard" component={Dashboard} />
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App;
