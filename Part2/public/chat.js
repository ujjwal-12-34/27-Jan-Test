const socket = io.connect("http://localhost:3000");

let div = document.getElementById("chat");
let chatArea = document.getElementById("chatArea");
let roomID = "123";
let roomsDiv = document.getElementById("allRooms");
let msg = document.getElementById("chatText");

function addToRoom(id){
    console.log(id);
    roomID = id;
    socket.join(id);
}

socket.on('chat',(data)=>{
    console.log(data);
    div.innerHTML += data;
});

function sendMsg() {
    if(msg.value==null){
        msg.value = "";
    }
    console.log('msg sent');
    console.log('msg',msg.value);
    socket.emit(roomID, msg.value);
    chatArea.innerText+= msg.value;
    chatArea.innerHTML+= `</br>`;
    msg.value = "";
}
// socket.on(roomID, data=>{
//     // chatArea.value+=data;
// });


async function loadRooms() {
    let response = await fetch("http://localhost:3000/getRooms");

    let rooms = await response.json();
    // console.log(JSON.parse(rooms));
    // let ans = rooms.totalRooms;
    // console.log(rooms);

    console.log(roomsDiv.innerHTML);
    roomsDiv = `<h1>Rooms</h1>`;
    for (let item in rooms) {
        console.log(rooms[item]);
        // console.log(this.id);
        roomsDiv.innerHTML += `
                    <button onclick="addToRoom()">${rooms[item]}</button>
            </br>`;
        // console.log("111");
    }
}