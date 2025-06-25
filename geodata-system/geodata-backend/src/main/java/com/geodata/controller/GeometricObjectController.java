package com.geodata.controller;

import com.geodata.model.GeometricObject;
import com.geodata.service.GeometricObjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/objects")
@CrossOrigin(origins = "*")
public class GeometricObjectController {

    @Autowired
    private GeometricObjectService geometricObjectService;

    @GetMapping
    public ResponseEntity<List<GeometricObject>> getAllObjects() {
        List<GeometricObject> objects = geometricObjectService.getAllObjects();
        return ResponseEntity.ok(objects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GeometricObject> getObjectById(@PathVariable Long id) {
        GeometricObject object = geometricObjectService.getObjectById(id);
        if (object != null) {
            return ResponseEntity.ok(object);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<GeometricObject> createObject(@RequestBody GeometricObject geometricObject) {
        GeometricObject createdObject = geometricObjectService.createObject(geometricObject);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdObject);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GeometricObject> updateObject(@PathVariable Long id, 
                                                       @RequestBody GeometricObject geometricObject) {
        geometricObject.setId(id);
        GeometricObject updatedObject = geometricObjectService.updateObject(geometricObject);
        return ResponseEntity.ok(updatedObject);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteObject(@PathVariable Long id) {
        geometricObjectService.deleteObject(id);
        return ResponseEntity.noContent().build();
    }
}

