package com.sathviksystems.rental;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;

/**
 * @author Soumika Seelam
 */
// tag::code[]
@Data
@Entity
public class Vehicle {

	private @Id @GeneratedValue Long id;
	private String make;
	private String model;
	private String year;

	private @Version @JsonIgnore Long version;

	private @ManyToOne Manager manager;

	private Vehicle() {}

	public Vehicle(String make, String model, String year, Manager manager) {
		this.make = make;
		this.model = model;
		this.year = year;
		this.manager = manager;
	}
}
// end::code[]