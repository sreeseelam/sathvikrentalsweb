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
@RepositoryEventHandler(Vehicle.class)
public class VehicleEventHandler {

	private final SimpMessagingTemplate websocket;

	private final EntityLinks entityLinks;

	@Autowired
	public VehicleEventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
		this.websocket = websocket;
		this.entityLinks = entityLinks;
	}

	@HandleAfterCreate
	public void newVehicle(Vehicle vehicle) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/newVehicle", getPath(vehicle));
	}

	@HandleAfterDelete
	public void deleteVehicle(Vehicle vehicle) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/deleteVehicle", getPath(vehicle));
	}

	@HandleAfterSave
	public void updateVehicle(Vehicle vehicle) {
		this.websocket.convertAndSend(
				WebSocketConfiguration.MESSAGE_PREFIX + "/updateVehicle", getPath(vehicle));
	}

	/**
	 * Take an {@link Vehicle} and get the URI using Spring Data REST's {@link EntityLinks}.
	 *
	 * @param vehicle
	 */
	private String getPath(Vehicle vehicle) {
		return this.entityLinks.linkForSingleResource(vehicle.getClass(),
				vehicle.getId()).toUri().getPath();
	}

}
// end::code[]
