  function injectHTML(list, carto) {
    console.log('fired injectHTML');
    const target = document.querySelector('#data');
    target.innerHTML = '';
    if(list.length > 0) {
      list.forEach((item, index) =>{
        target.innerHTML += `<li> [${item.submitteddate.substring(0, item.submitteddate.length - 13)}] - ${item.location.toUpperCase()}</li>`;
      });
    }
    markerPlace(list, carto);
  }
  
  function filterList(list, startDate, endDate, city) {
    console.log(list)
    return_list = list.filter((item) => {
      var date = new Date(item.submitteddate);
      return (date >= new Date(startDate) && date <= new Date(endDate)) && item.city.toLowerCase().includes(city.toLowerCase());
    });
    return return_list;
  }

  function initMap() {
    const carto = L.map('map').setView([38.83, -76.85], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(carto);
    return carto;
  }

  function markerPlace(list, map) {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });
    if (list.length > 0) {
      list.forEach((item) => {
        if (item.hasOwnProperty('location')) {
          coordinates = getCoords(item.location);
          coordinates.then((coords) => {
            L.marker(coords).bindPopup(item.location.toUpperCase()).addTo(map);
          });
        }
      });
    }
  }

  async function getCoords(location) {
    const results = await fetch(`https://api.geoapify.com/v1/geocode/search?text={${location}}&apiKey=b7b1726064c940869f2c3f56dfc945fe`);
    const coords = await results.json();
    if(coords.hasOwnProperty('features')){
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
    const startDate = document.querySelector("#start_date");
    const endDate = document.querySelector("#end_date");
    const city = document.querySelector("#city");

    const loadAnimation = document.querySelector('#load_animation');
    loadAnimation.style.display = 'none';
    filterButton.classList.add('hidden');

    const carto = initMap();
    
    let storedData = JSON.parse(localStorage.getItem('storedData'));
    if(storedData?.length > 0) {
      filterButton.classList.remove('hidden');
    }

    dataLoadButton.addEventListener('click', async (submitEvent) => {
      console.log('Load data');
      loadAnimation.style.display = 'inline-block';
      const results = await fetch("https://data.princegeorgescountymd.gov/resource/mnie-hrv7.json?$limit=17500&$where=submitteddate>'2019-01-01'");
      const storedList = await results.json();
      localStorage.setItem('storedData', JSON.stringify(storedList));
      storedData = storedList;
      if(storedData?.length > 0) {
        filterButton.classList.remove('hidden');
      }
      loadAnimation.style.display = 'none';
      console.log(storedList);
    });

    dataClearButton.addEventListener('click', (event) => {
      console.log('clear browser data');
      localStorage.clear();
      filterButton.classList.add('hidden');
      console.log('localStorage Check', localStorage.getItem('storedData'));
      injectHTML("", carto);
    });
  
    filterButton.addEventListener('click', (event) => {
      console.log('Generate new list');
      currentList = filterList(storedData, startDate.value, endDate.value, city.value);
      injectHTML(currentList, carto);
    });
  }
  
  document.addEventListener('DOMContentLoaded', async () => mainEvent());