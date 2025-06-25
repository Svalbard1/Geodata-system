// Конфигурация API
const API_BASE_URL = 'http://localhost:8080/api/objects';

// Глобальные переменные
let map;
let vectorSource;
let vectorLayer;
let drawInteraction;
let modifyInteraction;
let selectInteraction;
let currentDrawType = null;
let selectedFeature = null;

// Инициализация карты
function initMap() {
    // Создаем источник данных для векторного слоя
    vectorSource = new ol.source.Vector();
    
    // Создаем векторный слой для отображения геометрических объектов
    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        })
    });

    // Создаем карту
    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            }),
            vectorLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([37.6173, 55.7558]), // Москва
            zoom: 10
        })
    });

    // Инициализация взаимодействий
    initInteractions();
    
    // Загрузка существующих объектов
    loadObjects();
}

// Инициализация взаимодействий
function initInteractions() {
    // Взаимодействие для модификации
    modifyInteraction = new ol.interaction.Modify({
        source: vectorSource
    });
    
    // Взаимодействие для выбора
    selectInteraction = new ol.interaction.Select();
    
    // Обработчик выбора объекта
    selectInteraction.on('select', function(event) {
        if (event.selected.length > 0) {
            selectedFeature = event.selected[0];
            const properties = selectedFeature.getProperties();
            updateStatus(`Выбран объект: ${properties.name || 'Без названия'} (${properties.type || 'Неизвестный тип'})`);
        } else {
            selectedFeature = null;
            updateStatus('Готов к работе');
        }
    });
}

// Добавление инструмента рисования
function addDrawInteraction(type) {
    removeInteractions();
    
    let geometryType;
    switch(type) {
        case 'point':
            geometryType = 'Point';
            break;
        case 'line':
            geometryType = 'LineString';
            break;
        case 'polygon':
            geometryType = 'Polygon';
            break;
        default:
            return;
    }
    
    drawInteraction = new ol.interaction.Draw({
        source: vectorSource,
        type: geometryType
    });
    
    drawInteraction.on('drawend', function(event) {
        const feature = event.feature;
        feature.setProperties({
            type: type,
            name: '',
            saved: false
        });
        
        updateStatus(`${getTypeDisplayName(type)} создан. Введите название и сохраните.`);
        
        // Автоматически выбираем созданный объект
        setTimeout(() => {
            selectInteraction.getFeatures().clear();
            selectInteraction.getFeatures().push(feature);
            selectedFeature = feature;
        }, 100);
    });
    
    map.addInteraction(drawInteraction);
    currentDrawType = type;
    
    updateStatus(`Режим рисования: ${getTypeDisplayName(type)}`);
}

// Удаление всех взаимодействий
function removeInteractions() {
    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
    }
    if (modifyInteraction) {
        map.removeInteraction(modifyInteraction);
    }
    if (selectInteraction) {
        map.removeInteraction(selectInteraction);
    }
    currentDrawType = null;
}

// Активация режима модификации
function activateModifyMode() {
    removeInteractions();
    map.addInteraction(selectInteraction);
    map.addInteraction(modifyInteraction);
    updateStatus('Режим редактирования. Выберите объект для изменения.');
}

// Активация режима удаления
function activateDeleteMode() {
    removeInteractions();
    map.addInteraction(selectInteraction);
    updateStatus('Режим удаления. Выберите объект для удаления.');
}

// Сохранение объекта
async function saveObject() {
    if (!selectedFeature) {
        alert('Выберите объект для сохранения');
        return;
    }
    
    const name = document.getElementById('object-name').value.trim();
    if (!name) {
        alert('Введите название объекта');
        return;
    }
    
    const geometry = selectedFeature.getGeometry();
    const coordinates = geometry.getCoordinates();
    const type = selectedFeature.getProperties().type;
    
    const objectData = {
        name: name,
        type: type,
        coordinates: JSON.stringify(coordinates)
    };
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(objectData)
        });
        
        if (response.ok) {
            const savedObject = await response.json();
            selectedFeature.setProperties({
                id: savedObject.id,
                name: savedObject.name,
                type: savedObject.type,
                saved: true
            });
            
            document.getElementById('object-name').value = '';
            updateStatus(`Объект "${name}" сохранен`);
            loadObjects();
        } else {
            throw new Error('Ошибка сохранения');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        updateStatus('Ошибка сохранения объекта');
    }
}

// Удаление объекта
async function deleteSelectedObject() {
    if (!selectedFeature) {
        alert('Выберите объект для удаления');
        return;
    }
    
    const properties = selectedFeature.getProperties();
    const objectName = properties.name || 'Без названия';
    
    if (!confirm(`Удалить объект "${objectName}"?`)) {
        return;
    }
    
    try {
        if (properties.id) {
            const response = await fetch(`${API_BASE_URL}/${properties.id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления с сервера');
            }
        }
        
        vectorSource.removeFeature(selectedFeature);
        selectedFeature = null;
        selectInteraction.getFeatures().clear();
        
        updateStatus(`Объект "${objectName}" удален`);
        loadObjects();
    } catch (error) {
        console.error('Ошибка:', error);
        updateStatus('Ошибка удаления объекта');
    }
}

// Загрузка объектов с сервера
async function loadObjects() {
    try {
        const response = await fetch(API_BASE_URL);
        if (response.ok) {
            const objects = await response.json();
            displayObjectsList(objects);
            loadObjectsOnMap(objects);
        } else {
            throw new Error('Ошибка загрузки');
        }
    } catch (error) {
        console.error('Ошибка загрузки объектов:', error);
        updateStatus('Ошибка загрузки объектов с сервера');
    }
}

// Отображение объектов на карте
function loadObjectsOnMap(objects) {
    // Очищаем только сохраненные объекты
    const features = vectorSource.getFeatures();
    features.forEach(feature => {
        if (feature.getProperties().saved) {
            vectorSource.removeFeature(feature);
        }
    });
    
    objects.forEach(obj => {
        try {
            const coordinates = JSON.parse(obj.coordinates);
            let geometry;
            
            switch(obj.type) {
                case 'point':
                    geometry = new ol.geom.Point(coordinates);
                    break;
                case 'line':
                    geometry = new ol.geom.LineString(coordinates);
                    break;
                case 'polygon':
                    geometry = new ol.geom.Polygon(coordinates);
                    break;
                default:
                    return;
            }
            
            const feature = new ol.Feature({
                geometry: geometry
            });
            
            feature.setProperties({
                id: obj.id,
                name: obj.name,
                type: obj.type,
                saved: true
            });
            
            vectorSource.addFeature(feature);
        } catch (error) {
            console.error('Ошибка создания объекта:', error);
        }
    });
}

// Отображение списка объектов
function displayObjectsList(objects) {
    const listContainer = document.getElementById('objects-list');
    listContainer.innerHTML = '';
    
    if (objects.length === 0) {
        listContainer.innerHTML = '<div class="object-item">Нет сохраненных объектов</div>';
        return;
    }
    
    objects.forEach(obj => {
        const item = document.createElement('div');
        item.className = 'object-item';
        item.innerHTML = `
            <div class="object-name">${obj.name}</div>
            <div class="object-type">${getTypeDisplayName(obj.type)}</div>
        `;
        
        item.addEventListener('click', () => {
            focusOnObject(obj.id);
        });
        
        listContainer.appendChild(item);
    });
}

// Фокусировка на объекте
function focusOnObject(objectId) {
    const features = vectorSource.getFeatures();
    const feature = features.find(f => f.getProperties().id === objectId);
    
    if (feature) {
        const geometry = feature.getGeometry();
        const extent = geometry.getExtent();
        map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 15 });
        
        // Выбираем объект
        selectInteraction.getFeatures().clear();
        selectInteraction.getFeatures().push(feature);
        selectedFeature = feature;
    }
}

// Получение отображаемого названия типа
function getTypeDisplayName(type) {
    switch(type) {
        case 'point': return 'Маркер';
        case 'line': return 'Линия';
        case 'polygon': return 'Многоугольник';
        default: return 'Неизвестный тип';
    }
}

// Обновление статуса
function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

// Обновление активных кнопок
function updateActiveButtons(activeButtonId) {
    const buttons = document.querySelectorAll('.tool-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (activeButtonId) {
        document.getElementById(activeButtonId).classList.add('active');
    }
}

// Инициализация обработчиков событий
function initEventHandlers() {
    // Кнопки рисования
    document.getElementById('draw-point').addEventListener('click', () => {
        addDrawInteraction('point');
        updateActiveButtons('draw-point');
    });
    
    document.getElementById('draw-line').addEventListener('click', () => {
        addDrawInteraction('line');
        updateActiveButtons('draw-line');
    });
    
    document.getElementById('draw-polygon').addEventListener('click', () => {
        addDrawInteraction('polygon');
        updateActiveButtons('draw-polygon');
    });
    
    // Кнопка модификации
    document.getElementById('modify').addEventListener('click', () => {
        activateModifyMode();
        updateActiveButtons('modify');
    });
    
    // Кнопка удаления
    document.getElementById('delete').addEventListener('click', () => {
        if (currentDrawType === null) {
            deleteSelectedObject();
        } else {
            activateDeleteMode();
            updateActiveButtons('delete');
        }
    });
    
    // Кнопка сохранения
    document.getElementById('save-object').addEventListener('click', saveObject);
    
    // Кнопка обновления списка
    document.getElementById('refresh-list').addEventListener('click', loadObjects);
    
    // Enter в поле названия
    document.getElementById('object-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveObject();
        }
    });
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initEventHandlers();
    updateStatus('Приложение загружено. Выберите инструмент для начала работы.');
});

