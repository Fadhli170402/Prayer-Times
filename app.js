function success(position){
    console.log(position);
}
function error(){
    console.log('Error: Geolocation is not available.');
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