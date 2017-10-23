package com.sathviksystems.rental;

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * @author Soumika Seelam
 */
// tag::code[]
@PreAuthorize("hasRole('ROLE_MANAGER')")
public interface VehicleRepository extends PagingAndSortingRepository<Vehicle, Long> {

	@Override
	@PreAuthorize("#vehicle?.manager == null or #vehicle?.manager?.name == authentication?.name")
	Vehicle save(@Param("vehicle") Vehicle vehicle);

	@Override
	@PreAuthorize("@vehicleRepository.findOne(#id)?.manager?.name == authentication?.name")
	void delete(@Param("id") Long id);

	@Override
	@PreAuthorize("#vehicle?.manager?.name == authentication?.name")
	void delete(@Param("vehicle") Vehicle vehicle);

}
// end::code[]
