var React = require('react');
var Router = require('react-router').Router;
var Route = require('react-router').Route;
var IndexRoute = require('react-router').IndexRoute;
var browserHistory = require('react-router').browserHistory;

var Main = require('./components/main');
var Vehicle = require('./components/vehicle');
var Maintenance = require('./components/maintenance');
var Customer = require('./components/customer');
var About = require('./components/about');

module.exports = (
    <Router history={browserHistory}>
        <Route path="/" component={Main}>
            <IndexRoute component={Maintenance} />
            <Route path="vehicle" component={Vehicle} />
            <Route path="maintenance" component={Maintenance} />
            <Route path="customer" component={Customer} />
            <Route path="about" component={About} />
        </Route>
    </Router>
);