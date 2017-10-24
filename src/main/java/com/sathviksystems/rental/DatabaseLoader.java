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
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * @author Soumika Seelam
 */
// tag::code[]
@Component
public class DatabaseLoader implements CommandLineRunner {

	private final PersonRepository persons;
	private final ManagerRepository managers;
	private final VehicleRepository vehicles;

	@Autowired
	public DatabaseLoader(PersonRepository personRepository,
						  ManagerRepository managerRepository, VehicleRepository vehicleRepository) {

		this.persons = personRepository;
		this.managers = managerRepository;
		this.vehicles = vehicleRepository;
	}

	@Override
	public void run(String... strings) throws Exception {
/*
		Manager sreeni = this.managers.save(new Manager("sreeni", "admin",
				"ROLE_MANAGER"));
		Manager greg = this.managers.save(new Manager("greg", "turnquist",
				"ROLE_MANAGER"));
		Manager oliver = this.managers.save(new Manager("oliver", "gierke",
				"ROLE_MANAGER"));

		SecurityContextHolder.getContext().setAuthentication(
				new UsernamePasswordAuthenticationToken("sreeni", "doesn't matter",
						AuthorityUtils.createAuthorityList("ROLE_MANAGER")));

		this.persons.save(new Person("Sreeni", "Seelam", "ring bearer", sreeni));
		this.persons.save(new Person("Soumi", "Seelam", "burglar", sreeni));
		this.persons.save(new Person("Vaishu", "Seelam", "wizard", sreeni));
		this.persons.save(new Person("Suchi", "Seelam", "wizard", sreeni));

		this.vehicles.save(new Vehicle("Honda", "Odyssey", "2008", sreeni));
		this.vehicles.save(new Vehicle("BMW", "Van", "2017", sreeni));
		this.vehicles.save(new Vehicle("Benz", "Car", "2018", sreeni));

		SecurityContextHolder.getContext().setAuthentication(
				new UsernamePasswordAuthenticationToken("greg", "doesn't matter",
						AuthorityUtils.createAuthorityList("ROLE_MANAGER")));

		this.persons.save(new Person("Frodo", "Baggins", "ring bearer", greg));
		this.persons.save(new Person("Bilbo", "Baggins", "burglar", greg));
		this.persons.save(new Person("Gandalf", "the Grey", "wizard", greg));

		SecurityContextHolder.getContext().setAuthentication(
				new UsernamePasswordAuthenticationToken("oliver", "doesn't matter",
						AuthorityUtils.createAuthorityList("ROLE_MANAGER")));

		this.persons.save(new Person("Samwise", "Gamgee", "gardener", oliver));
		this.persons.save(new Person("Merry", "Brandybuck", "pony rider", oliver));
		this.persons.save(new Person("Peregrin", "Took", "pipe smoker", oliver));

		SecurityContextHolder.clearContext();
		*/
	}
}
// end::code[]