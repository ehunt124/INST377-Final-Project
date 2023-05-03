function injectHTML(list, map) {
  console.log('injectHTML');
  const data = document.querySelector('#data');
  const total = document.querySelector('#total');
  data.innerHTML = '';
  count = 0;
  if (list.length > 0) {
    list.forEach((item, index) => {
      count++;
      data.innerHTML += `<li> [${item.submitteddate.substring(0, item.submitteddate.length - 13)}] - ${item.location.toUpperCase()}</li>`;
    });
    total.innerHTML = 'Number of Foreclosures: ' + count;
  } else {
    total.innerHTML = 'Number of Foreclosures: -';
  }
  console.log('injectHTML done');
  markerPlace(list, map);
}

function filterList(list, startDate, endDate, city) {
  return list.filter((item) => {
    var date = new Date(item.submitteddate);
    return (date >= new Date(startDate) && date <= new Date(endDate)) && item.city.toLowerCase().includes(city.toLowerCase());
  });
}

function initMap() {
  const map = L.map('map').setView([38.83, -76.85], 9);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  const border = getBorder();
  border.then((coords) => {
    L.geoJSON(coords).addTo(map);
  });
  return map;
}

function markerPlace(list, map) {
  console.log('markerPlace');
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      layer.remove();
    }
  });
  if (list.length > 0) {
    list.forEach((item) => {
      const coordinates = getCoords(item.location);
      coordinates.then((coords) => {
        L.marker(coords).bindPopup(item.location.toUpperCase()).addTo(map);
      });
    });
    getCoords(list[0].location).then((coords) => {
      map.flyTo(coords, 10);
    });
  }
  console.log('markerPlace done');
}

async function getBorder() {
  const border = await fetch("https://data.princegeorgescountymd.gov/resource/qytr-rie2.geojson");
  return await border.json();
}

async function getCoords(location) {
  // we remove # in the location because it throws a bad request
  const results = await fetch(`https://api.geoapify.com/v1/geocode/search?text={${location.replace('#','')}}&apiKey=b7b1726064c940869f2c3f56dfc945fe`);
  const coords = await results.json();
  if (coords.hasOwnProperty('features')) {
    leafletCoords = coords.features[0].geometry.coordinates;
    return [leafletCoords[1], leafletCoords[0]];
  }
  return Promise.reject();
}

async function mainEvent() {
  const form = document.querySelector('.main_form');
  const dataLoadButton = document.querySelector('#data_load');
  const dataClearButton = document.querySelector('#data_clear');
  const filterButton = document.querySelector('#data_filter');
  const clearFilterButton = document.querySelector("#clear_filter");
  const startDate = document.querySelector("#start_date");
  const endDate = document.querySelector("#end_date");
  const city = document.querySelector("#city");
  const map_toggle = document.querySelector("#map_toggle");
  const data_toggle = document.querySelector("#data_toggle");

  const loadAnimation = document.querySelector('#load_animation');
  loadAnimation.style.display = 'none';
  filterButton.classList.add('hidden');

  const map = initMap();

  let storedData = JSON.parse(localStorage.getItem('storedData'));
  if (storedData?.length > 0) {
    filterButton.classList.remove('hidden');
  }

  dataLoadButton.addEventListener('click', async (submitEvent) => {
    console.log('Loading data');
    loadAnimation.style.display = 'inline-block';
    const results = await fetch("https://data.princegeorgescountymd.gov/resource/mnie-hrv7.json?$limit=17500&$where=submitteddate>'2019-01-01'");
    const storedList = await results.json();
    localStorage.setItem('storedData', JSON.stringify(storedList));
    storedData = storedList;
    if (storedData?.length > 0) {
      filterButton.classList.remove('hidden');
    }
    loadAnimation.style.display = 'none';
    console.log('Loaded data');
  });

  dataClearButton.addEventListener('click', (event) => {
    console.log('Clearing browser data');
    localStorage.clear();
    storedData = []
    filterButton.classList.add('hidden');
    console.log('Browser data cleared');
    injectHTML("", map);
  });

  filterButton.addEventListener('click', (event) => {
    console.log('Filtering data');
    const areaList = filterList(storedData, startDate.value, endDate.value, city.value);
    if (areaList.length > 2000) {
      alert(`Filtered dataset is too large to display! ${areaList.length}/2000`);
      console.log(`Filtered dataset too large${areaList.length}/2000`);
    } else {
      console.log('Data filtered');
      injectHTML(areaList, map);
    }
  });

  clearFilterButton.addEventListener('click', (event) => {
    console.log('Clearing filters');
    document.getElementById("start_date").value = "";
    document.getElementById("end_date").value = "";
    document.getElementById("city").value = "";
    console.log('Filters cleared');
  });


  city.addEventListener("keypress", function(event) {
    console.log('Enter keypress triggered Filter data');
    if (event.keyCode == 13) {
      event.preventDefault();
      document.getElementById("data_filter").click();
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => mainEvent());
