'use strict';

const React = require('react');
const ReactDOM = require('react-dom')
const when = require('when');
const client = require('../client');

const follow = require('../follow'); // function to hop multiple links by "rel"

const stompClient = require('../websocket-listener');

const root = '/api';

module.exports = class PersonApp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {persons: [], attributes: [], page: 1, pageSize: 2, links: {}};
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
            {rel: 'persons', params: {size: pageSize}}]
        ).then(personCollection => {
            return client({
                method: 'GET',
                path: personCollection.entity._links.profile.href,
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
        this.links = personCollection.entity._links;
        return personCollection;
        // end::json-schema-filter[]
    });
    }).then(personCollection => {
            this.page = personCollection.entity.page;
        return personCollection.entity._embedded.persons.map(person =>
            client({
                method: 'GET',
                path: person._links.self.href
            })
    );
    }).then(personPromises => {
            return when.all(personPromises);
    }).done(persons => {
            this.setState({
            page: this.page,
            persons: persons,
            attributes: Object.keys(this.schema.properties),
            pageSize: pageSize,
            links: this.links
        });
    });
    }

    // tag::on-create[]
    onCreate(newPerson) {
        follow(client, root, ['persons']).done(response => {
            client({
                       method: 'POST',
                       path: response.entity._links.self.href,
            entity: newPerson,
            headers: {'Content-Type': 'application/json'}
    })
    })
    }
    // end::on-create[]

    // tag::on-update[]
    onUpdate(person, updatedPerson) {
        client({
            method: 'PUT',
            path: person.entity._links.self.href,
            entity: updatedPerson,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': person.headers.Etag
            }
        }).done(response => {
            /* Let the websocket handler update the state */
        }, response => {
            if (response.status.code === 403) {
                alert('ACCESS DENIED: You are not authorized to update ' +
                    person.entity._links.self.href);
            }
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' + person.entity._links.self.href +
                    '. Your copy is stale.');
            }
        });
    }
    // end::on-update[]

    // tag::on-delete[]
    onDelete(person) {
        client({method: 'DELETE', path: person.entity._links.self.href}
        ).done(response => {/* let the websocket handle updating the UI */},
            response => {
            if (response.status.code === 403) {
                alert('ACCESS DENIED: You are not authorized to delete ' +
                    person.entity._links.self.href);
            }
        });
    }
    // end::on-delete[]

    onNavigate(navUri) {
        client({
            method: 'GET',
            path: navUri
        }).then(personCollection => {
            this.links = personCollection.entity._links;
        this.page = personCollection.entity.page;

        return personCollection.entity._embedded.persons.map(person =>
            client({
                method: 'GET',
                path: person._links.self.href
            })
    );
    }).then(personPromises => {
            return when.all(personPromises);
    }).done(persons => {
            this.setState({
            page: this.page,
            persons: persons,
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
            rel: 'persons',
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
            rel: 'persons',
            params: {
                size: this.state.pageSize,
                page: this.state.page.number
            }
        }]).then(personCollection => {
            this.links = personCollection.entity._links;
        this.page = personCollection.entity.page;

        return personCollection.entity._embedded.persons.map(person => {
            return client({
                method: 'GET',
                path: person._links.self.href
            })
        });
    }).then(personPromises => {
            return when.all(personPromises);
    }).then(persons => {
            this.setState({
            page: this.page,
            persons: persons,
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
            {route: '/topic/newPerson', callback: this.refreshAndGoToLastPage},
            {route: '/topic/updatePerson', callback: this.refreshCurrentPage},
            {route: '/topic/deletePerson', callback: this.refreshCurrentPage}
        ]);
    }
    // end::register-handlers[]

    render() {
        return (
            <div>
            <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
        <PersonList page={this.state.page}
        persons={this.state.persons}
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
        var newPerson = {};
        this.props.attributes.forEach(attribute => {
            newPerson[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
    });
        this.props.onCreate(newPerson);
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
            <a href="#createPerson">Create</a>

            <div id="createPerson" className="modalDialog">
            <div>
            <a href="#" title="Close" className="close">X</a>

            <h2>Create new person</h2>

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
        var updatedPerson = {};
        this.props.attributes.forEach(attribute => {
            updatedPerson[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        updatedPerson['manager'] = this.props.person.entity.manager;
        this.props.onUpdate(this.props.person, updatedPerson);
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
            <p key={this.props.person.entity[attribute]}>
    <input type="text" placeholder={attribute}
        defaultValue={this.props.person.entity[attribute]}
        ref={attribute} className="field" />
            </p>
    );

        var dialogId = "updatePerson-" + this.props.person.entity._links.self.href;

        return (
            <div>
            <a href={"#" + dialogId}>Update</a>

            <div id={dialogId} className="modalDialog">
            <div>
            <a href="#" title="Close" className="close">X</a>

            <h2>Update an person</h2>

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

class PersonList extends React.Component {

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
    <h3>Persons - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

        var persons = this.props.persons.map(person =>
            <Person key={person.entity._links.self.href}
        person={person}
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
        <th>First Name</th>
        <th>Last Name</th>
        <th>Description</th>
        <th>Manager Name</th>
        <th></th>
        <th></th>
        </tr>
        {persons}
    </tbody>
        </table>
        <div>
        {navLinks}
        </div>
        </div>
    )
    }
}

// tag::person[]
class Person extends React.Component {

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.person);
    }

    render() {
        return (
            <tr>
            <td>{this.props.person.entity.firstName}</td>
        <td>{this.props.person.entity.lastName}</td>
        <td>{this.props.person.entity.description}</td>
        <td>{this.props.person.entity.manager?<div>{this.props.person.entity.manager.name}</div>:<div>NA</div>}</td>
        <td>
        <UpdateDialog person={this.props.person}
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
// end::person[]

//ReactDOM.render(
//<PersonApp />,
//    document.getElementById('personapp')
//)

