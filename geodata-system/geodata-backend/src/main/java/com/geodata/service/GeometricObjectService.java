package com.geodata.service;

import com.geodata.mapper.GeometricObjectMapper;
import com.geodata.model.GeometricObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class GeometricObjectService {

    @Autowired
    private GeometricObjectMapper geometricObjectMapper;

    public List<GeometricObject> getAllObjects() {
        return geometricObjectMapper.findAll();
    }

    public GeometricObject getObjectById(Long id) {
        return geometricObjectMapper.findById(id);
    }

    public GeometricObject createObject(GeometricObject geometricObject) {
        geometricObjectMapper.insert(geometricObject);
        return geometricObject;
    }

    public GeometricObject updateObject(GeometricObject geometricObject) {
        geometricObjectMapper.update(geometricObject);
        return geometricObject;
    }

    public void deleteObject(Long id) {
        geometricObjectMapper.delete(id);
    }
}

