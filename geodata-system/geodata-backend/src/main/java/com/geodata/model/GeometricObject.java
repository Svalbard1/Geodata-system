package com.geodata.model;

public class GeometricObject {
    private Long id;
    private String name;
    private String type;
    private String coordinates;

    public GeometricObject() {}

    public GeometricObject(String name, String type, String coordinates) {
        this.name = name;
        this.type = type;
        this.coordinates = coordinates;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(String coordinates) {
        this.coordinates = coordinates;
    }

    @Override
    public String toString() {
        return "GeometricObject{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", type='" + type + '\'' +
                ", coordinates='" + coordinates + '\'' +
                '}';
    }
}

