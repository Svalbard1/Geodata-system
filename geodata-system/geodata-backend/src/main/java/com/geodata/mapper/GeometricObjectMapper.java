package com.geodata.mapper;

import com.geodata.model.GeometricObject;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface GeometricObjectMapper {
    List<GeometricObject> findAll();
    GeometricObject findById(Long id);
    void insert(GeometricObject geometricObject);
    void update(GeometricObject geometricObject);
    void delete(Long id);
}

