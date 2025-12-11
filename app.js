function prayerTimes(latitude, longitude){
    fetch('http://api.aladhan.com/v1/calendar?latitude='+latitude+'&longitude='+longitude+'&method=20')
    .then(response => response.json())
    .then(function(response){
        let date = new Date();
        let today = date.getDate() - 1;
        // console.log(response.data[today]);
        let data = response.data[0].timings;
        let app = document.getElementById('app');
        let table = document.createElement('table');
        let tableTbody = document.createElement('tbody');
        
        // console.log(data);
        for (i in data){
            let row = tableTbody.insertRow();
            let name = row.insertCell(0);
            let time = row.insertCell(1);
            name.innerHTML = i;
            time.innerHTML = data[i];
            // insert Tbody
            tableTbody.appendChild(row);
            
        }
        table.appendChild(tableTbody);
        app.appendChild(table);
    });
}

function success(position){
   prayerTimes(position.coords.latitude, position.coords.longitude);
}
function error(){
    // Default location: Jakarta
   prayerTimes(-6.21462, 106.84513);
}

function userLocation(){
    if(!navigator.geolocation){
        alert('Geolocation is not supported by this browser.');
    }else{
        navigator.geolocation.getCurrentPosition(success, error);
    }
}

function index(){
    let app = document.getElementById('app');
    let h3 = document.createElement('h3');
    h3.innerHTML = 'Prayer Time';
    app.appendChild(h3);

    userLocation();
}
index();