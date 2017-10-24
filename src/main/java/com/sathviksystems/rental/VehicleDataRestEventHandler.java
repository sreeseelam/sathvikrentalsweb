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
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * @author Soumika Seelam
 */
// tag::code[]
@Component
@RepositoryEventHandler(Vehicle.class)
public class VehicleDataRestEventHandler {

	private final ManagerRepository managerRepository;

	@Autowired
	public VehicleDataRestEventHandler(ManagerRepository managerRepository) {
		this.managerRepository = managerRepository;
	}

	@HandleBeforeCreate
	public void applyUserInformationUsingSecurityContext(Vehicle vehicle) {

		String name = SecurityContextHolder.getContext().getAuthentication().getName();
		Manager manager = this.managerRepository.findByName(name);
		if (manager == null) {
			Manager newManager = new Manager();
			newManager.setName(name);
			newManager.setRoles(new String[]{"ROLE_MANAGER"});
			manager = this.managerRepository.save(newManager);
		}
		vehicle.setManager(manager);
	}
}
// end::code[]
