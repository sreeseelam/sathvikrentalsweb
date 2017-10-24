'use strict';

const React = require('react');
const ReactDOM = require('react-dom')
const when = require('when');
const client = require('../client');

const follow = require('../follow'); // function to hop multiple links by "rel"

const stompClient = require('../websocket-listener');

const root = '/api';

module.exports = class VehicleApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {vehicles: [], attributes: [], page: 1, pageSize: 10, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
        this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
        this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
    }

    loadFromServer(pageSize) {
        follow(client, root, [
            {rel: 'vehicles', params: {size: pageSize}}]
        ).then(vehicleCollection => {
            return client({
                method: 'GET',
                path: vehicleCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                // tag::json-schema-filter[]
                /**
                 * Filter unneeded JSON Schema properties, like uri references and
                 * subtypes ($ref).
                 */
                Object.keys(schema.entity.properties).forEach(function (property) {
                    if (schema.entity.properties[property].hasOwnProperty('format') &&
                        schema.entity.properties[property].format === 'uri') {
                        delete schema.entity.properties[property];
                    }
                    else if (schema.entity.properties[property].hasOwnProperty('$ref')) {
                        delete schema.entity.properties[property];
                    }
                });

                this.schema = schema.entity;
                this.links = vehicleCollection.entity._links;
                return vehicleCollection;
                // end::json-schema-filter[]
            });
        }).then(vehicleCollection => {
            this.page = vehicleCollection.entity.page;
            return vehicleCollection.entity._embedded.vehicles.map(vehicle =>
                client({
                    method: 'GET',
                    path: vehicle._links.self.href
                })
            );
        }).then(vehiclePromises => {
            return when.all(vehiclePromises);
        }).done(vehicles => {
            this.setState({
                page: this.page,
                vehicles: vehicles,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: this.links
            });
        });
    }

    // tag::on-create[]
    onCreate(newVehicle) {
        follow(client, root, ['vehicles']).done(response => {
            client({
                method: 'POST',
                path: response.entity._links.self.href,
                entity: newVehicle,
                headers: {'Content-Type': 'application/json'}
            })
        })
    }
    // end::on-create[]

    // tag::on-update[]
    onUpdate(vehicle, updatedVehicle) {
        client({
            method: 'PUT',
            path: vehicle.entity._links.self.href,
            entity: updatedVehicle,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': vehicle.headers.Etag
            }
        }).done(response => {
            /* Let the websocket handler update the state */
        }, response => {
            if (response.status.code === 403) {
                alert('ACCESS DENIED: You are not authorized to update ' +
                    vehicle.entity._links.self.href);
            }
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' + vehicle.entity._links.self.href +
                    '. Your copy is stale.');
            }
        });
    }
    // end::on-update[]

    // tag::on-delete[]
    onDelete(vehicle) {
        client({method: 'DELETE', path: vehicle.entity._links.self.href}
        ).done(response => {/* let the websocket handle updating the UI */},
            response => {
                if (response.status.code === 403) {
                    alert('ACCESS DENIED: You are not authorized to delete ' +
                        vehicle.entity._links.self.href);
                }
            });
    }
    // end::on-delete[]

    onNavigate(navUri) {
        client({
            method: 'GET',
            path: navUri
        }).then(vehicleCollection => {
            this.links = vehicleCollection.entity._links;
            this.page = vehicleCollection.entity.page;

            return vehicleCollection.entity._embedded.vehicles.map(vehicle =>
                client({
                    method: 'GET',
                    path: vehicle._links.self.href
                })
            );
        }).then(vehiclePromises => {
            return when.all(vehiclePromises);
        }).done(vehicles => {
            this.setState({
                page: this.page,
                vehicles: vehicles,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    // tag::websocket-handlers[]
    refreshAndGoToLastPage(message) {
        follow(client, root, [{
            rel: 'vehicles',
            params: {size: this.state.pageSize}
        }]).done(response => {
            if (response.entity._links.last !== undefined) {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        })
    }

    refreshCurrentPage(message) {
        follow(client, root, [{
            rel: 'vehicles',
            params: {
                size: this.state.pageSize,
                page: this.state.page.number
            }
        }]).then(vehicleCollection => {
            this.links = vehicleCollection.entity._links;
            this.page = vehicleCollection.entity.page;

            return vehicleCollection.entity._embedded.vehicles.map(vehicle => {
                return client({
                    method: 'GET',
                    path: vehicle._links.self.href
                })
            });
        }).then(vehiclePromises => {
            return when.all(vehiclePromises);
        }).then(vehicles => {
            this.setState({
                page: this.page,
                vehicles: vehicles,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }
    // end::websocket-handlers[]

    // tag::register-handlers[]
    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
        stompClient.register([
            {route: '/topic/newVehicle', callback: this.refreshAndGoToLastPage},
            {route: '/topic/updateVehicle', callback: this.refreshCurrentPage},
            {route: '/topic/deleteVehicle', callback: this.refreshCurrentPage}
        ]);
    }
    // end::register-handlers[]

    render() {
        return (
            <div>
            <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
        <VehicleList page={this.state.page}
        vehicles={this.state.vehicles}
        links={this.state.links}
        pageSize={this.state.pageSize}
        attributes={this.state.attributes}
        onNavigate={this.onNavigate}
        onUpdate={this.onUpdate}
        onDelete={this.onDelete}
        updatePageSize={this.updatePageSize}/>
        </div>
    )
    }
}

class CreateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        var newVehicle = {};
        this.props.attributes.forEach(attribute => {
            newVehicle[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newVehicle);
        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = ''; // clear out the dialog's inputs
        });
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
            <p key={attribute}>
            <input type="text" placeholder={attribute} ref={attribute} className="field" />
            </p>
    );
        return (
            <div>
            <a href="#createVehicle">Create</a>

            <div id="createVehicle" className="modalDialog">
            <div>
            <a href="#" title="Close" className="close">X</a>

            <h2>Create new vehicle</h2>

        <form>
        {inputs}
        <button onClick={this.handleSubmit}>Create</button>
        </form>
        </div>
        </div>
        </div>
    )
    }
}

class UpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        var updatedVehicle = {};
        this.props.attributes.forEach(attribute => {
            updatedVehicle[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        updatedVehicle['manager'] = this.props.vehicle.entity.manager;
        this.props.onUpdate(this.props.vehicle, updatedVehicle);
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
            <p key={this.props.vehicle.entity[attribute]}>
    <input type="text" placeholder={attribute}
        defaultValue={this.props.vehicle.entity[attribute]}
        ref={attribute} className="field" />
            </p>
    );

        var dialogId = "updateVehicle-" + this.props.vehicle.entity._links.self.href;

        return (
            <div>
            <a href={"#" + dialogId}>Update</a>

            <div id={dialogId} className="modalDialog">
            <div>
            <a href="#" title="Close" className="close">X</a>

            <h2>Update an vehicle</h2>

        <form>
        {inputs}
        <button onClick={this.handleSubmit}>Update</button>
        </form>
        </div>
        </div>
        </div>
    )
    }

}

class VehicleList extends React.Component {

    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        e.preventDefault();
        var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value = pageSize.substring(0, pageSize.length - 1);
        }
    }

    handleNavFirst(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    render() {
        var pageInfo = this.props.page.hasOwnProperty("number") ?
    <h3>Vehicles - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

        var vehicles = this.props.vehicles.map(vehicle =>
            <Vehicle key={vehicle.entity._links.self.href}
        vehicle={vehicle}
        attributes={this.props.attributes}
        onUpdate={this.props.onUpdate}
        onDelete={this.props.onDelete}/>
    );

        var navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
            {pageInfo}
            <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
        <table>
        <tbody>
        <tr>
        <th>Make</th>
        <th>Model</th>
        <th>Year</th>
        <th>Manager</th>
        <th></th>
        <th></th>
        </tr>
        {vehicles}
    </tbody>
        </table>
        <div>
        {navLinks}
        </div>
        </div>
    )
    }
}

// tag::vehicle[]
class Vehicle extends React.Component {

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.vehicle);
    }

    render() {
        return (
            <tr>
            <td>{this.props.vehicle.entity.make}</td>
        <td>{this.props.vehicle.entity.model}</td>
        <td>{this.props.vehicle.entity.year}</td>
        <td>{this.props.vehicle.entity.manager.name}</td>
        <td>{this.props.vehicle.entity.manager?<div>{this.props.vehicle.entity.manager.name}</div>:<div>NA</div>}</td>
        <td>
        <UpdateDialog vehicle={this.props.vehicle}
        attributes={this.props.attributes}
        onUpdate={this.props.onUpdate}/>
        </td>
        <td>
        <button onClick={this.handleDelete}>Delete</button>
        </td>
        </tr>
    )
    }
}
// end::vehicle[]
