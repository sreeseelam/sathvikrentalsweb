/*
 * Copyright 2015 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.sathviksystems.rental;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * @author Soumika Seelam
 */
// tag::code[]
@Component
@RepositoryEventHandler(Person.class)
public class EventHandler {

	private final SimpMessagingTemplate websocket;

	private final EntityLinks entityLinks;

	@Autowired
	public EventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
		this.websocket = websocket;
		this.entityLinks = entityLinks;
	}

	@HandleAfterCreate
	public void newPerson(Person person) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/newPerson", getPath(person));
	}

	@HandleAfterDelete
	public void deletePerson(Person person) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/deletePerson", getPath(person));
	}

	@HandleAfterSave
	public void updatePerson(Person person) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/updatePerson", getPath(person));
	}

	/**
	 * Take an {@link Person} and get the URI using Spring Data REST's {@link EntityLinks}.
	 *
	 * @param person
	 */
	private String getPath(Person person) {
		return this.entityLinks.linkForSingleResource(person.getClass(),
				person.getId()).toUri().getPath();
	}

}
// end::code[]
