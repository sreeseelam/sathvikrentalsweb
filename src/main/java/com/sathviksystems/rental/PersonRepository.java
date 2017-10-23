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

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * @author Soumika Seelam
 */
// tag::code[]
@PreAuthorize("hasRole('ROLE_MANAGER')")
public interface PersonRepository extends PagingAndSortingRepository<Person, Long> {

	@Override
	@PreAuthorize("#person?.manager == null or #person?.manager?.name == authentication?.name")
	Person save(@Param("person") Person person);

	@Override
	@PreAuthorize("@personRepository.findOne(#id)?.manager?.name == authentication?.name")
	void delete(@Param("id") Long id);

	@Override
	@PreAuthorize("#person?.manager?.name == authentication?.name")
	void delete(@Param("person") Person person);

}
// end::code[]
